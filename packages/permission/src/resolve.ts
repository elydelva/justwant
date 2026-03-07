/**
 * @justwant/permission — Resolution logic
 */

import type { AtomicPermission } from "./define/permission/defineAtomicPermission.js";
import type { RealmDef } from "./define/realm/defineRealm.js";
import type { RoleDef } from "./define/role/defineRole.js";
import type {
  Actor,
  Assignment,
  AssignmentsRepo,
  Override,
  OverridesRepo,
  Resource,
  Scope,
} from "./types/index.js";

export interface ResolveContext {
  actor: Actor;
  action: AtomicPermission;
  scope: Scope;
  resource?: Resource;
  realm: RealmDef;
  assignments: AssignmentsRepo;
  overrides: OverridesRepo;
}

function actorToRepo(actor: Actor) {
  return {
    actorType: actor.type,
    actorId: actor.id,
  };
}

function scopeToRepo(scope: Scope) {
  return {
    scopeType: scope.type,
    scopeId: scope.id ?? null,
  };
}

export async function findAssignment(ctx: ResolveContext): Promise<Assignment | null> {
  const where = {
    ...actorToRepo(ctx.actor),
    ...scopeToRepo(ctx.scope),
  };
  return ctx.assignments.findOne(where as Partial<Assignment>);
}

export async function findOverrides(ctx: ResolveContext): Promise<Override[]> {
  const where = {
    ...actorToRepo(ctx.actor),
    ...scopeToRepo(ctx.scope),
    permission: ctx.action.id,
  };
  return ctx.overrides.findMany(where as Partial<Override>);
}

export async function findDenyOverride(ctx: ResolveContext): Promise<Override | null> {
  const overrides = await findOverrides(ctx);
  const denies = overrides.filter((o) => o.type === "deny");

  if (ctx.resource) {
    const { type, id } = ctx.resource;
    const resourceDeny = denies.find((o) => o.resourceType === type && o.resourceId === id);
    if (resourceDeny) return resourceDeny;
  }
  const scopeDeny = denies.find((o) => !o.resourceType && !o.resourceId);
  return scopeDeny ?? null;
}

export async function findGrantOverride(ctx: ResolveContext): Promise<Override | null> {
  const overrides = await findOverrides(ctx);
  const grants = overrides.filter((o) => o.type === "grant");

  if (ctx.resource) {
    const { type, id } = ctx.resource;
    const resourceGrant = grants.find((o) => o.resourceType === type && o.resourceId === id);
    if (resourceGrant) return resourceGrant;
  }
  const scopeGrant = grants.find((o) => !o.resourceType && !o.resourceId);
  return scopeGrant ?? null;
}

export function getRolePermissions(role: RoleDef): Set<string> {
  return role.resolved;
}
