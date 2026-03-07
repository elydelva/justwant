/**
 * @justwant/permission — Resolution logic
 */

import type { AtomicPermission } from "./define/permission/createAtomicPermission.js";
import type { RealmDef } from "./define/realm/createRealm.js";
import type { RoleDef } from "./define/role/createRole.js";
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
    actorOrgId: actor.orgId,
  };
}

function scopeToRepo(scope: Scope) {
  return {
    scopeType: scope.type,
    scopeId: scope.id ?? null,
    scopeOrgId: scope.orgId,
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

export async function checkCeiling(
  role: RoleDef,
  actor: Actor,
  assignments: AssignmentsRepo,
  realmByName: Map<string, RealmDef>
): Promise<boolean> {
  const ceiling = role.ceiling;
  if (!ceiling) return true;

  const parentRealmName = ceiling.realm;
  if (!parentRealmName) return true;

  const parentRealm = realmByName.get(parentRealmName);
  if (!parentRealm) return true;

  const parentScope = parentRealm.scope;
  const scopeId = parentScope.singular ? null : "";

  const assignment = await assignments.findOne({
    ...actorToRepo(actor),
    scopeType: parentRealmName,
    scopeId: parentScope.singular ? null : scopeId,
  } as Partial<Assignment>);

  if (!assignment) return false;

  const userRole = parentRealm.roleByName.get(assignment.role);
  if (!userRole) return false;

  for (const permId of ceiling.resolved) {
    if (!userRole.resolved.has(permId)) return false;
  }
  return true;
}
