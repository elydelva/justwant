/**
 * @justwant/permission — createPermission
 * Runtime instance with full API.
 */

import type { AtomicPermission } from "./define/permission/createAtomicPermission.js";
import type { RealmDef } from "./define/realm/createRealm.js";
import type { RoleDef } from "./define/role/createRole.js";
import { CeilingViolationError, PermissionDeniedError } from "./errors/index.js";
import {
  type ResolveContext,
  checkCeiling,
  findAssignment,
  findDenyOverride,
  findGrantOverride,
  getRolePermissions,
} from "./resolve.js";
import type { Actor, Resource, Scope } from "./types/index.js";
import type {
  Assignment,
  AssignmentsRepo,
  CreateInput,
  Override,
  OverridesRepo,
} from "./types/index.js";

export interface CreatePermissionOptions<ScopeNames extends string = string> {
  repos: {
    assignments: AssignmentsRepo;
    overrides: OverridesRepo;
  };
  realms: Record<ScopeNames, RealmDef>;
}

function getRealmByScope(scope: Scope, realms: Record<string, RealmDef>): RealmDef | null {
  return realms[scope.type] ?? null;
}

/** API returned by createPermission() — Actor, Scope, Resource must be explicit objects */
export interface PermissionApi<ScopeNames extends string = string> {
  can(
    actor: Actor,
    action: AtomicPermission,
    scope: Scope<ScopeNames>,
    resource?: Resource
  ): Promise<boolean>;
  assert(
    actor: Actor,
    action: AtomicPermission,
    scope: Scope<ScopeNames>,
    resource?: Resource,
    opts?: { message?: string }
  ): Promise<void>;
  assign(actor: Actor, role: RoleDef, scope: Scope<ScopeNames>): Promise<void>;
  hasRole(actor: Actor, role: RoleDef, scope: Scope<ScopeNames>): Promise<boolean>;
  unassign(actor: Actor, scope: Scope<ScopeNames>): Promise<void>;
  grant(
    actor: Actor,
    action: AtomicPermission,
    scope: Scope<ScopeNames>,
    resource?: Resource
  ): Promise<void>;
  deny(
    actor: Actor,
    action: AtomicPermission,
    scope: Scope<ScopeNames>,
    resource?: Resource
  ): Promise<void>;
  revokeGrant(
    actor: Actor,
    action: AtomicPermission,
    scope: Scope<ScopeNames>,
    resource?: Resource
  ): Promise<void>;
  revokeDeny(
    actor: Actor,
    action: AtomicPermission,
    scope: Scope<ScopeNames>,
    resource?: Resource
  ): Promise<void>;
  canAll(
    actor: Actor,
    actions: AtomicPermission[],
    scope: Scope<ScopeNames>,
    resource?: Resource
  ): Promise<boolean>;
  canAny(
    actor: Actor,
    actions: AtomicPermission[],
    scope: Scope<ScopeNames>,
    resource?: Resource
  ): Promise<boolean>;
  canMany(
    actors: Actor[],
    action: AtomicPermission,
    scope: Scope<ScopeNames>,
    resource?: Resource
  ): Promise<Map<string, boolean>>;
  explain(
    actor: Actor,
    action: AtomicPermission,
    scope: Scope<ScopeNames>,
    resource?: Resource
  ): Promise<{ result: boolean; reason?: string; role?: string }>;
  revokeScope(scope: Scope<ScopeNames>): Promise<void>;
  revokeAll(actor: Actor): Promise<void>;
  realm(name: ScopeNames): RealmDef | undefined;
}

export function createPermission<ScopeNames extends string = string>(
  options: CreatePermissionOptions<ScopeNames>
): PermissionApi<ScopeNames> {
  const { repos, realms } = options;
  const realmByName = new Map<string, RealmDef>(Object.entries(realms));

  async function resolve(
    actor: Actor,
    action: AtomicPermission,
    scope: Scope,
    resource?: Resource
  ): Promise<{ allowed: boolean; reason?: string; role?: string }> {
    const realm = getRealmByScope(scope, realms);
    if (!realm) {
      return { allowed: false, reason: "unknown_scope" };
    }

    if (!realm.permissionById.has(action.id)) {
      return { allowed: false, reason: "permission_not_in_realm" };
    }

    const ctx: ResolveContext = {
      actor,
      action,
      scope,
      resource,
      realm,
      assignments: repos.assignments,
      overrides: repos.overrides,
    };

    const deny = await findDenyOverride(ctx);
    if (deny) {
      return { allowed: false, reason: "deny" };
    }

    const grant = await findGrantOverride(ctx);
    if (grant) {
      return { allowed: true, reason: "grant" };
    }

    const assignment = await findAssignment(ctx);
    if (!assignment) {
      return { allowed: false, reason: "no_assignment" };
    }

    const role = realm.roleByName.get(assignment.role);
    if (!role) {
      return { allowed: false, reason: "unknown_role" };
    }

    const permissions = getRolePermissions(role);
    if (permissions.has(action.id)) {
      return { allowed: true, reason: "role", role: role.name };
    }

    return { allowed: false, reason: "role", role: role.name };
  }

  async function can(
    actor: Actor,
    action: AtomicPermission,
    scope: Scope,
    resource?: Resource
  ): Promise<boolean> {
    const result = await resolve(actor, action, scope, resource);
    return result.allowed;
  }

  async function assert(
    actor: Actor,
    action: AtomicPermission,
    scope: Scope,
    resource?: Resource,
    opts?: { message?: string }
  ): Promise<void> {
    const allowed = await can(actor, action, scope, resource);
    if (!allowed) {
      throw new PermissionDeniedError(
        opts?.message ?? `Permission denied: ${action.id}`,
        actor.id,
        action.id,
        scope.id ?? undefined
      );
    }
  }

  async function assign(actor: Actor, role: RoleDef, scope: Scope): Promise<void> {
    const realm = getRealmByScope(scope, realms);
    if (!realm) {
      throw new Error(`Unknown scope type: ${scope.type}`);
    }

    const ceilingOk = await checkCeiling(role, actor, repos.assignments, realmByName);
    if (!ceilingOk) {
      throw new CeilingViolationError(
        `Role ${role.name} requires ceiling role ${role.ceiling?.name} in parent realm`,
        role.ceiling?.name,
        undefined
      );
    }

    const existing = await repos.assignments.findOne({
      actorType: actor.type,
      actorId: actor.id,
      actorOrgId: actor.orgId,
      scopeType: scope.type,
      scopeId: scope.id ?? null,
      scopeOrgId: scope.orgId,
    } as Parameters<AssignmentsRepo["findOne"]>[0]);

    const data = {
      actorType: actor.type,
      actorId: actor.id,
      actorOrgId: actor.orgId,
      role: role.name,
      scopeType: scope.type,
      scopeId: scope.id ?? null,
      scopeOrgId: scope.orgId,
    };

    if (existing) {
      await repos.assignments.update(existing.id, { role: role.name });
    } else {
      await repos.assignments.create(data as CreateInput<Assignment>);
    }
  }

  async function hasRole(actor: Actor, role: RoleDef, scope: Scope): Promise<boolean> {
    const assignment = await repos.assignments.findOne({
      actorType: actor.type,
      actorId: actor.id,
      actorOrgId: actor.orgId,
      scopeType: scope.type,
      scopeId: scope.id ?? null,
      scopeOrgId: scope.orgId,
    } as Parameters<AssignmentsRepo["findOne"]>[0]);
    return assignment?.role === role.name;
  }

  async function unassign(actor: Actor, scope: Scope): Promise<void> {
    const assignment = await repos.assignments.findOne({
      actorType: actor.type,
      actorId: actor.id,
      actorOrgId: actor.orgId,
      scopeType: scope.type,
      scopeId: scope.id ?? null,
      scopeOrgId: scope.orgId,
    } as Parameters<AssignmentsRepo["findOne"]>[0]);
    if (assignment) {
      await repos.assignments.delete(assignment.id);
    }
  }

  async function grant(
    actor: Actor,
    action: AtomicPermission,
    scope: Scope,
    resource?: Resource
  ): Promise<void> {
    const existing = await repos.overrides.findOne({
      type: "grant",
      actorType: actor.type,
      actorId: actor.id,
      actorOrgId: actor.orgId,
      permission: action.id,
      scopeType: scope.type,
      scopeId: scope.id ?? null,
      scopeOrgId: scope.orgId,
      resourceType: resource?.type,
      resourceId: resource?.id,
      resourceOrgId: resource?.orgId,
    } as Parameters<OverridesRepo["findOne"]>[0]);

    if (!existing) {
      await repos.overrides.create({
        type: "grant",
        actorType: actor.type,
        actorId: actor.id,
        actorOrgId: actor.orgId,
        permission: action.id,
        scopeType: scope.type,
        scopeId: scope.id ?? null,
        scopeOrgId: scope.orgId,
        resourceType: resource?.type,
        resourceId: resource?.id,
        resourceOrgId: resource?.orgId,
      } as CreateInput<Override>);
    }
  }

  async function deny(
    actor: Actor,
    action: AtomicPermission,
    scope: Scope,
    resource?: Resource
  ): Promise<void> {
    const existing = await repos.overrides.findOne({
      type: "deny",
      actorType: actor.type,
      actorId: actor.id,
      actorOrgId: actor.orgId,
      permission: action.id,
      scopeType: scope.type,
      scopeId: scope.id ?? null,
      scopeOrgId: scope.orgId,
      resourceType: resource?.type,
      resourceId: resource?.id,
      resourceOrgId: resource?.orgId,
    } as Parameters<OverridesRepo["findOne"]>[0]);

    if (!existing) {
      await repos.overrides.create({
        type: "deny",
        actorType: actor.type,
        actorId: actor.id,
        actorOrgId: actor.orgId,
        permission: action.id,
        scopeType: scope.type,
        scopeId: scope.id ?? null,
        scopeOrgId: scope.orgId,
        resourceType: resource?.type,
        resourceId: resource?.id,
        resourceOrgId: resource?.orgId,
      } as CreateInput<Override>);
    }
  }

  async function revokeGrant(
    actor: Actor,
    action: AtomicPermission,
    scope: Scope,
    resource?: Resource
  ): Promise<void> {
    const override = await repos.overrides.findOne({
      type: "grant",
      actorType: actor.type,
      actorId: actor.id,
      actorOrgId: actor.orgId,
      permission: action.id,
      scopeType: scope.type,
      scopeId: scope.id ?? null,
      scopeOrgId: scope.orgId,
      resourceType: resource?.type,
      resourceId: resource?.id,
      resourceOrgId: resource?.orgId,
    } as Parameters<OverridesRepo["findOne"]>[0]);
    if (override) {
      await repos.overrides.delete(override.id);
    }
  }

  async function revokeDeny(
    actor: Actor,
    action: AtomicPermission,
    scope: Scope,
    resource?: Resource
  ): Promise<void> {
    const override = await repos.overrides.findOne({
      type: "deny",
      actorType: actor.type,
      actorId: actor.id,
      actorOrgId: actor.orgId,
      permission: action.id,
      scopeType: scope.type,
      scopeId: scope.id ?? null,
      scopeOrgId: scope.orgId,
      resourceType: resource?.type,
      resourceId: resource?.id,
      resourceOrgId: resource?.orgId,
    } as Parameters<OverridesRepo["findOne"]>[0]);
    if (override) {
      await repos.overrides.delete(override.id);
    }
  }

  async function canAll(
    actor: Actor,
    actions: AtomicPermission[],
    scope: Scope,
    resource?: Resource
  ): Promise<boolean> {
    for (const action of actions) {
      if (!(await can(actor, action, scope, resource))) return false;
    }
    return true;
  }

  async function canAny(
    actor: Actor,
    actions: AtomicPermission[],
    scope: Scope,
    resource?: Resource
  ): Promise<boolean> {
    for (const action of actions) {
      if (await can(actor, action, scope, resource)) return true;
    }
    return false;
  }

  async function canMany(
    actors: Actor[],
    action: AtomicPermission,
    scope: Scope,
    resource?: Resource
  ): Promise<Map<string, boolean>> {
    const result = new Map<string, boolean>();
    for (const a of actors) {
      const allowed = await can(a, action, scope, resource);
      result.set(a.id, allowed);
    }
    return result;
  }

  async function explain(
    actor: Actor,
    action: AtomicPermission,
    scope: Scope,
    resource?: Resource
  ): Promise<{ result: boolean; reason?: string; role?: string }> {
    const resolved = await resolve(actor, action, scope, resource);
    return {
      result: resolved.allowed,
      reason: resolved.reason,
      role: resolved.role,
    };
  }

  async function revokeScope(scope: Scope): Promise<void> {
    const assignments = await repos.assignments.findMany({
      scopeType: scope.type,
      scopeId: scope.id ?? null,
      scopeOrgId: scope.orgId,
    } as Partial<Assignment>);
    for (const a of assignments) {
      await repos.assignments.delete(a.id);
    }
    const overrides = await repos.overrides.findMany({
      scopeType: scope.type,
      scopeId: scope.id ?? null,
      scopeOrgId: scope.orgId,
    } as Partial<Override>);
    for (const o of overrides) {
      await repos.overrides.delete(o.id);
    }
  }

  async function revokeAll(actor: Actor): Promise<void> {
    const assignments = await repos.assignments.findMany({
      actorType: actor.type,
      actorId: actor.id,
      actorOrgId: actor.orgId,
    } as Partial<Assignment>);
    for (const asn of assignments) {
      await repos.assignments.delete(asn.id);
    }
    const overrides = await repos.overrides.findMany({
      actorType: actor.type,
      actorId: actor.id,
      actorOrgId: actor.orgId,
    } as Partial<Override>);
    for (const o of overrides) {
      await repos.overrides.delete(o.id);
    }
  }

  function realm(name: ScopeNames): RealmDef | undefined {
    return realms[name];
  }

  return {
    can,
    assert,
    assign,
    hasRole,
    unassign,
    grant,
    deny,
    revokeGrant,
    revokeDeny,
    canAll,
    canAny,
    canMany,
    explain,
    revokeScope,
    revokeAll,
    realm,
  };
}
