/**
 * @justwant/permission — defineRealm
 * Composes scope + actors + resources + permissions + roles.
 */

import type { Inspectable } from "@justwant/meta";
import type { IdentityLike, ReferenceLike, ScopeLike } from "../../types/index.js";
import type { AtomicPermission } from "../permission/defineAtomicPermission.js";
import type { RoleDef } from "../role/defineRole.js";

export interface RealmDef<N extends string = string> extends Inspectable<N> {
  readonly name: N;
  readonly scope: ScopeLike;
  readonly actors: readonly IdentityLike[];
  readonly resources: readonly ReferenceLike[];
  readonly permissions: readonly AtomicPermission[];
  readonly roles: readonly RoleDef[];
  readonly roleByName: Map<string, RoleDef>;
  readonly permissionByName: Map<string, AtomicPermission>;
}

export interface DefineRealmOptions<N extends string = string> {
  name: N;
  scope: ScopeLike;
  actors: readonly IdentityLike[];
  resources?: readonly ReferenceLike[];
  permissions: readonly AtomicPermission[];
  roles: readonly RoleDef[];
}

export function defineRealm<N extends string>(options: DefineRealmOptions<N>): RealmDef<N> {
  const { name, scope, actors, resources = [], permissions, roles } = options;

  const roleByName = new Map<string, RoleDef>();
  for (const role of roles) {
    roleByName.set(role.name, role);
  }

  const permissionByName = new Map<string, AtomicPermission>();
  for (const perm of permissions) {
    permissionByName.set(perm.name, perm);
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
    get permissionByName() {
      return permissionByName;
    },
  };
}
