/**
 * @justwant/permission — createPermission
 * Runtime instance with full API.
 */

import type { AtomicPermission } from "./define/permission/defineAtomicPermission.js";
import type { RealmDef } from "./define/realm/defineRealm.js";
import type { RoleDef } from "./define/role/defineRole.js";
import { PermissionDeniedError } from "./errors/index.js";
import {
  type ResolveContext,
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
  /** Realms list. Lookup key is derived from realm.scope.name */
  realms: readonly RealmDef[];
}

function buildRealmMap(realms: readonly RealmDef[]): Map<string, RealmDef> {
  const map = new Map<string, RealmDef>();
  for (const realm of realms) {
    const key = realm.scope.name;
    if (map.has(key)) {
      throw new Error(`Duplicate realm scope name: ${key}`);
    }
    map.set(key, realm);
  }
  return map;
}

function getRealmByScope(scope: Scope, realmMap: Map<string, RealmDef>): RealmDef | null {
  return realmMap.get(scope.type) ?? null;
}

/** Params for can, grant, deny, revokeGrant, revokeDeny, explain */
export interface CanParams<ScopeNames extends string = string> {
  actor: Actor;
  action: AtomicPermission;
  scope: Scope<ScopeNames>;
  resource?: Resource;
}

/** Params for assert — extends CanParams with message */
export interface AssertParams<ScopeNames extends string = string> extends CanParams<ScopeNames> {
  message?: string;
}

/** Params for assign */
export interface AssignParams<ScopeNames extends string = string> {
  actor: Actor;
  role: RoleDef;
  scope: Scope<ScopeNames>;
}

/** Params for hasRole */
export interface HasRoleParams<ScopeNames extends string = string> {
  actor: Actor;
  role: RoleDef;
  scope: Scope<ScopeNames>;
}

/** Params for unassign */
export interface UnassignParams<ScopeNames extends string = string> {
  actor: Actor;
  scope: Scope<ScopeNames>;
}

/** Params for canAll, canAny */
export interface CanAllParams<ScopeNames extends string = string> {
  actor: Actor;
  actions: AtomicPermission[];
  scope: Scope<ScopeNames>;
  resource?: Resource;
}

/** Params for canMany */
export interface CanManyParams<ScopeNames extends string = string> {
  actors: Actor[];
  action: AtomicPermission;
  scope: Scope<ScopeNames>;
  resource?: Resource;
}

/** Params for revokeScope */
export interface RevokeScopeParams<ScopeNames extends string = string> {
  scope: Scope<ScopeNames>;
}

/** Params for revokeAll */
export interface RevokeAllParams {
  actor: Actor;
}

/** Params for realm */
export interface RealmParams<ScopeNames extends string = string> {
  name: ScopeNames;
}

/** API returned by createPermission() — Actor, Scope, Resource must be explicit objects */
export interface PermissionApi<ScopeNames extends string = string> {
  can(params: CanParams<ScopeNames>): Promise<boolean>;
  assert(params: AssertParams<ScopeNames>): Promise<void>;
  assign(params: AssignParams<ScopeNames>): Promise<void>;
  hasRole(params: HasRoleParams<ScopeNames>): Promise<boolean>;
  unassign(params: UnassignParams<ScopeNames>): Promise<void>;
  grant(params: CanParams<ScopeNames>): Promise<void>;
  deny(params: CanParams<ScopeNames>): Promise<void>;
  revokeGrant(params: CanParams<ScopeNames>): Promise<void>;
  revokeDeny(params: CanParams<ScopeNames>): Promise<void>;
  canAll(params: CanAllParams<ScopeNames>): Promise<boolean>;
  canAny(params: CanAllParams<ScopeNames>): Promise<boolean>;
  canMany(params: CanManyParams<ScopeNames>): Promise<Map<string, boolean>>;
  explain(
    params: CanParams<ScopeNames>
  ): Promise<{ result: boolean; reason?: string; role?: string }>;
  revokeScope(params: RevokeScopeParams<ScopeNames>): Promise<void>;
  revokeAll(params: RevokeAllParams): Promise<void>;
  realm(params: RealmParams<ScopeNames>): RealmDef | undefined;
}

export function createPermission<ScopeNames extends string = string>(
  options: CreatePermissionOptions<ScopeNames>
): PermissionApi<ScopeNames> {
  const { repos, realms } = options;
  const realmMap = buildRealmMap(realms);

  async function resolve(
    actor: Actor,
    action: AtomicPermission,
    scope: Scope,
    resource?: Resource
  ): Promise<{ allowed: boolean; reason?: string; role?: string }> {
    const realm = getRealmByScope(scope, realmMap);
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

  async function can(params: {
    actor: Actor;
    action: AtomicPermission;
    scope: Scope;
    resource?: Resource;
  }): Promise<boolean> {
    const { actor, action, scope, resource } = params;
    const result = await resolve(actor, action, scope, resource);
    return result.allowed;
  }

  async function assert(params: {
    actor: Actor;
    action: AtomicPermission;
    scope: Scope;
    resource?: Resource;
    message?: string;
  }): Promise<void> {
    const { actor, action, scope, resource, message } = params;
    const allowed = await can({ actor, action, scope, resource });
    if (!allowed) {
      throw new PermissionDeniedError(
        message ?? `Permission denied: ${action.id}`,
        actor.id,
        action.id,
        scope.id ?? undefined
      );
    }
  }

  async function assign(params: { actor: Actor; role: RoleDef; scope: Scope }): Promise<void> {
    const { actor, role, scope } = params;
    const realm = getRealmByScope(scope, realmMap);
    if (!realm) {
      throw new Error(`Unknown scope type: ${scope.type}`);
    }

    const existing = await repos.assignments.findOne({
      actorType: actor.type,
      actorId: actor.id,
      scopeType: scope.type,
      scopeId: scope.id ?? null,
    } as Parameters<AssignmentsRepo["findOne"]>[0]);

    const data = {
      actorType: actor.type,
      actorId: actor.id,
      role: role.name,
      scopeType: scope.type,
      scopeId: scope.id ?? null,
    };

    if (existing) {
      await repos.assignments.update(existing.id, { role: role.name });
    } else {
      await repos.assignments.create(data as CreateInput<Assignment>);
    }
  }

  async function hasRole(params: { actor: Actor; role: RoleDef; scope: Scope }): Promise<boolean> {
    const { actor, role, scope } = params;
    const assignment = await repos.assignments.findOne({
      actorType: actor.type,
      actorId: actor.id,
      scopeType: scope.type,
      scopeId: scope.id ?? null,
    } as Parameters<AssignmentsRepo["findOne"]>[0]);
    return assignment?.role === role.name;
  }

  async function unassign(params: { actor: Actor; scope: Scope }): Promise<void> {
    const { actor, scope } = params;
    const assignment = await repos.assignments.findOne({
      actorType: actor.type,
      actorId: actor.id,
      scopeType: scope.type,
      scopeId: scope.id ?? null,
    } as Parameters<AssignmentsRepo["findOne"]>[0]);
    if (assignment) {
      await repos.assignments.delete(assignment.id);
    }
  }

  async function grant(params: {
    actor: Actor;
    action: AtomicPermission;
    scope: Scope;
    resource?: Resource;
  }): Promise<void> {
    const { actor, action, scope, resource } = params;
    const existing = await repos.overrides.findOne({
      type: "grant",
      actorType: actor.type,
      actorId: actor.id,
      permission: action.id,
      scopeType: scope.type,
      scopeId: scope.id ?? null,
      resourceType: resource?.type,
      resourceId: resource?.id,
    } as Parameters<OverridesRepo["findOne"]>[0]);

    if (!existing) {
      await repos.overrides.create({
        type: "grant",
        actorType: actor.type,
        actorId: actor.id,
        permission: action.id,
        scopeType: scope.type,
        scopeId: scope.id ?? null,
        resourceType: resource?.type,
        resourceId: resource?.id,
      } as CreateInput<Override>);
    }
  }

  async function deny(params: {
    actor: Actor;
    action: AtomicPermission;
    scope: Scope;
    resource?: Resource;
  }): Promise<void> {
    const { actor, action, scope, resource } = params;
    const existing = await repos.overrides.findOne({
      type: "deny",
      actorType: actor.type,
      actorId: actor.id,
      permission: action.id,
      scopeType: scope.type,
      scopeId: scope.id ?? null,
      resourceType: resource?.type,
      resourceId: resource?.id,
    } as Parameters<OverridesRepo["findOne"]>[0]);

    if (!existing) {
      await repos.overrides.create({
        type: "deny",
        actorType: actor.type,
        actorId: actor.id,
        permission: action.id,
        scopeType: scope.type,
        scopeId: scope.id ?? null,
        resourceType: resource?.type,
        resourceId: resource?.id,
      } as CreateInput<Override>);
    }
  }

  async function revokeGrant(params: {
    actor: Actor;
    action: AtomicPermission;
    scope: Scope;
    resource?: Resource;
  }): Promise<void> {
    const { actor, action, scope, resource } = params;
    const override = await repos.overrides.findOne({
      type: "grant",
      actorType: actor.type,
      actorId: actor.id,
      permission: action.id,
      scopeType: scope.type,
      scopeId: scope.id ?? null,
      resourceType: resource?.type,
      resourceId: resource?.id,
    } as Parameters<OverridesRepo["findOne"]>[0]);
    if (override) {
      await repos.overrides.delete(override.id);
    }
  }

  async function revokeDeny(params: {
    actor: Actor;
    action: AtomicPermission;
    scope: Scope;
    resource?: Resource;
  }): Promise<void> {
    const { actor, action, scope, resource } = params;
    const override = await repos.overrides.findOne({
      type: "deny",
      actorType: actor.type,
      actorId: actor.id,
      permission: action.id,
      scopeType: scope.type,
      scopeId: scope.id ?? null,
      resourceType: resource?.type,
      resourceId: resource?.id,
    } as Parameters<OverridesRepo["findOne"]>[0]);
    if (override) {
      await repos.overrides.delete(override.id);
    }
  }

  async function canAll(params: {
    actor: Actor;
    actions: AtomicPermission[];
    scope: Scope;
    resource?: Resource;
  }): Promise<boolean> {
    const { actor, actions, scope, resource } = params;
    for (const action of actions) {
      if (!(await can({ actor, action, scope, resource }))) return false;
    }
    return true;
  }

  async function canAny(params: {
    actor: Actor;
    actions: AtomicPermission[];
    scope: Scope;
    resource?: Resource;
  }): Promise<boolean> {
    const { actor, actions, scope, resource } = params;
    for (const action of actions) {
      if (await can({ actor, action, scope, resource })) return true;
    }
    return false;
  }

  async function canMany(params: {
    actors: Actor[];
    action: AtomicPermission;
    scope: Scope;
    resource?: Resource;
  }): Promise<Map<string, boolean>> {
    const { actors, action, scope, resource } = params;
    const result = new Map<string, boolean>();
    for (const a of actors) {
      const allowed = await can({ actor: a, action, scope, resource });
      result.set(a.id, allowed);
    }
    return result;
  }

  async function explain(params: {
    actor: Actor;
    action: AtomicPermission;
    scope: Scope;
    resource?: Resource;
  }): Promise<{ result: boolean; reason?: string; role?: string }> {
    const { actor, action, scope, resource } = params;
    const resolved = await resolve(actor, action, scope, resource);
    return {
      result: resolved.allowed,
      reason: resolved.reason,
      role: resolved.role,
    };
  }

  async function revokeScope(params: { scope: Scope }): Promise<void> {
    const { scope } = params;
    const assignments = await repos.assignments.findMany({
      scopeType: scope.type,
      scopeId: scope.id ?? null,
    } as Partial<Assignment>);
    for (const a of assignments) {
      await repos.assignments.delete(a.id);
    }
    const overrides = await repos.overrides.findMany({
      scopeType: scope.type,
      scopeId: scope.id ?? null,
    } as Partial<Override>);
    for (const o of overrides) {
      await repos.overrides.delete(o.id);
    }
  }

  async function revokeAll(params: { actor: Actor }): Promise<void> {
    const { actor } = params;
    const assignments = await repos.assignments.findMany({
      actorType: actor.type,
      actorId: actor.id,
    } as Partial<Assignment>);
    for (const asn of assignments) {
      await repos.assignments.delete(asn.id);
    }
    const overrides = await repos.overrides.findMany({
      actorType: actor.type,
      actorId: actor.id,
    } as Partial<Override>);
    for (const o of overrides) {
      await repos.overrides.delete(o.id);
    }
  }

  function realm(params: { name: ScopeNames }): RealmDef | undefined {
    return realmMap.get(params.name);
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
