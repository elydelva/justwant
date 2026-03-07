/**
 * @justwant/permission — createRealm
 * Composes scope + actors + resources + permissions + roles.
 */

import type { ActorDef } from "../actor/createActor.js";
import type { AtomicPermission } from "../permission/createAtomicPermission.js";
import type { ResourceDef } from "../resource/createResource.js";
import type { RoleDef } from "../role/createRole.js";
import type { ScopeDef } from "../scope/createScope.js";

export interface RealmDef {
  readonly name: string;
  readonly scope: ScopeDef;
  readonly actors: readonly ActorDef[];
  readonly resources: readonly ResourceDef[];
  readonly permissions: readonly AtomicPermission[];
  readonly roles: readonly RoleDef[];
  readonly roleByName: Map<string, RoleDef>;
  readonly permissionById: Map<string, AtomicPermission>;
}

export interface CreateRealmOptions {
  name: string;
  scope: ScopeDef;
  actors: readonly ActorDef[];
  resources?: readonly ResourceDef[];
  permissions: readonly AtomicPermission[];
  roles: readonly RoleDef[];
}

export function createRealm(options: CreateRealmOptions): RealmDef {
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
