/**
 * @justwant/permission — defineRealm
 * Composes scope + actors + resources + permissions + roles.
 */

import type { IdentityLike, ReferenceLike, ScopeLike } from "../../types/index.js";
import type { AtomicPermission } from "../permission/defineAtomicPermission.js";
import type { RoleDef } from "../role/defineRole.js";

export interface RealmDef {
  readonly name: string;
  readonly scope: ScopeLike;
  readonly actors: readonly IdentityLike[];
  readonly resources: readonly ReferenceLike[];
  readonly permissions: readonly AtomicPermission[];
  readonly roles: readonly RoleDef[];
  readonly roleByName: Map<string, RoleDef>;
  readonly permissionById: Map<string, AtomicPermission>;
}

export interface DefineRealmOptions {
  name: string;
  scope: ScopeLike;
  actors: readonly IdentityLike[];
  resources?: readonly ReferenceLike[];
  permissions: readonly AtomicPermission[];
  roles: readonly RoleDef[];
}

export function defineRealm(options: DefineRealmOptions): RealmDef {
  const { name, scope, actors, resources = [], permissions, roles } = options;

  const roleByName = new Map<string, RoleDef>();
  for (const role of roles) {
    roleByName.set(role.name, role);
  }

  const permissionById = new Map<string, AtomicPermission>();
  for (const perm of permissions) {
    permissionById.set(perm.id, perm);
  }

  return {
    get name() {
      return name;
    },
    get scope() {
      return scope;
    },
    get actors() {
      return actors;
    },
    get resources() {
      return resources;
    },
    get permissions() {
      return permissions;
    },
    get roles() {
      return roles;
    },
    get roleByName() {
      return roleByName;
    },
    get permissionById() {
      return permissionById;
    },
  };
}
