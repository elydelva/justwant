/**
 * @justwant/permission — defineRole
 * Defines a role.
 */

import type { AtomicPermission } from "../permission/defineAtomicPermission.js";

export interface RoleDef {
  readonly name: string;
  readonly permissions: readonly AtomicPermission[];
  readonly except: readonly AtomicPermission[];
  readonly realm?: string;
  readonly resolved: Set<string>;
}

export interface DefineRoleOptions {
  name: string;
  permissions: readonly AtomicPermission[];
  except?: readonly AtomicPermission[];
  realm?: string;
}

export function defineRole(options: DefineRoleOptions): RoleDef {
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
