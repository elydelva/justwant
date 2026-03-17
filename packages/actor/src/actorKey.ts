/**
 * @justwant/actor — actorKey, toRepo, parseActorKey
 * Serialization and repo shape utilities.
 */

import type { Actor } from "./types.js";

/**
 * Serialize actor for storage keys, logs, errors.
 * Format: type:id or type:id:withinType:withinId
 */
export function actorKey(actor: Actor): string {
  const parts = [actor.type, actor.id];
  if (actor.within) {
    parts.push(actor.within.type, actor.within.id);
  }
  return parts.join(":");
}

/** Input shape from repos (waitlist, lock). Supports legacy actorOrgId. */
export interface RepoShapeInput {
  actorType: string;
  actorId: string;
  actorOrgId?: string;
  actorWithinType?: string;
  actorWithinId?: string;
}

/** Repo shape for packages that persist (waitlist, lock, preference). */
export interface RepoShape {
  actorType: string;
  actorId: string;
  actorWithinType?: string;
  actorWithinId?: string;
  /** Legacy: when within.type === "org", for compat with waitlist/lock. */
  actorOrgId?: string;
}

/**
 * Flatten actor to repo shape for packages that persist.
 * Returns actorType, actorId, and optionally actorWithinType/actorWithinId.
 * When within.type === "org", also sets actorOrgId for legacy compat.
 */
export function toRepo(actor: Actor): RepoShape {
  const shape: RepoShape = {
    actorType: actor.type,
    actorId: actor.id,
  };
  if (actor.within) {
    shape.actorWithinType = actor.within.type;
    shape.actorWithinId = actor.within.id;
    if (actor.within.type === "org") {
      shape.actorOrgId = actor.within.id;
    }
  }
  return shape;
}

/**
 * Build Actor from repo shape.
 * Prefers actorWithinType/actorWithinId; falls back to actorOrgId → within: { type: "org", id }.
 */
export function fromRepo(shape: RepoShapeInput): Actor {
  const { actorType, actorId, actorOrgId, actorWithinType, actorWithinId } = shape;
  const actor: Actor = { type: actorType, id: actorId };
  if (actorWithinType && actorWithinId) {
    actor.within = { type: actorWithinType, id: actorWithinId };
  } else if (actorOrgId) {
    actor.within = { type: "org", id: actorOrgId };
  }
  return actor;
}

/**
 * Parse actorKey back to Actor.
 * Format: type:id or type:id:withinType:withinId
 * @throws Error if key is invalid (too few parts)
 */
export function parseActorKey(key: string): Actor {
  const parts = key.split(":");
  if (parts.length < 2) {
    throw new Error(
      `parseActorKey: invalid key "${key}" (expected type:id or type:id:withinType:withinId)`
    );
  }
  const type = parts[0] ?? "";
  const id = parts[1] ?? "";
  if (parts.length === 2) {
    return { type, id };
  }
  if (parts.length === 4) {
    const withinType = parts[2] ?? "";
    const withinId = parts[3] ?? "";
    return {
      type,
      id,
      within: { type: withinType, id: withinId },
    };
  }
  if (parts.length === 3) {
    const orgId = parts[2] ?? "";
    return {
      type,
      id,
      within: { type: "org", id: orgId },
    };
  }
  throw new Error(
    `parseActorKey: invalid key "${key}" (expected 2, 3, or 4 parts, got ${parts.length})`
  );
}
