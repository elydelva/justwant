/**
 * @justwant/permission — defineRole
 * Defines a role.
 */

import type { Inspectable } from "@justwant/meta";
import type { AtomicPermission } from "../permission/defineAtomicPermission.js";

export interface RoleDef<N extends string = string> extends Inspectable<N> {
  readonly name: N;
  readonly permissions: readonly AtomicPermission[];
  readonly except: readonly AtomicPermission[];
  readonly realm?: string;
  readonly resolved: Set<string>;
}

export interface DefineRoleOptions<N extends string = string> {
  name: N;
  permissions: readonly AtomicPermission[];
  except?: readonly AtomicPermission[];
  realm?: string;
}

export function defineRole<N extends string>(options: DefineRoleOptions<N>): RoleDef<N> {
  const { name, permissions, except = [], realm } = options;

  const exceptNames = new Set(except.map((p) => p.name));
  const resolved = new Set(permissions.filter((p) => !exceptNames.has(p.name)).map((p) => p.name));

  const roleDef: RoleDef<N> = {
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
