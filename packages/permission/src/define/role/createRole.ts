/**
 * @justwant/permission — createRole
 * Defines a role.
 */

import type { AtomicPermission } from "../permission/createAtomicPermission.js";

export interface RoleDef {
  readonly name: string;
  readonly permissions: readonly AtomicPermission[];
  readonly except: readonly AtomicPermission[];
  readonly realm?: string;
  readonly resolved: Set<string>;
}

export interface CreateRoleOptions {
  name: string;
  permissions: readonly AtomicPermission[];
  except?: readonly AtomicPermission[];
  realm?: string;
}

export function createRole(options: CreateRoleOptions): RoleDef {
  const { name, permissions, except = [], realm } = options;

  const exceptIds = new Set(except.map((p) => p.id));
  const resolved = new Set(permissions.filter((p) => !exceptIds.has(p.id)).map((p) => p.id));

  const roleDef: RoleDef = {
    get name() {
      return name;
    },
    get permissions() {
      return permissions;
    },
    get except() {
      return except;
    },
    get realm() {
      return realm;
    },
    get resolved() {
      return resolved;
    },
  };

  return roleDef;
}
