/**
 * @justwant/lock — createLockOwner
 * Defines who can hold a lock (system, user, etc.).
 * Infers literal type N from name for build-time type safety.
 */

import type { LockOwner } from "../../types/index.js";

export interface CreateLockOwnerOptions<N extends string = string> {
  name: N;
  within?: string;
}

export interface LockOwnerDef<N extends string = string> {
  readonly name: N;
  readonly within?: string;
  (id: string): LockOwner<N>;
  (orgId: string, id: string): LockOwner<N>;
}

export function createLockOwner<N extends string>(
  options: CreateLockOwnerOptions<N>
): LockOwnerDef<N> {
  const { name, within } = options;

  const ownerDef = ((idOrOrgId?: string, id?: string): LockOwner<N> => {
    if (within && idOrOrgId !== undefined && id !== undefined) {
      return {
        type: name,
        id,
        orgId: idOrOrgId,
      };
    }
    if (idOrOrgId !== undefined) {
      return {
        type: name,
        id: idOrOrgId,
      };
    }
    throw new Error(`createLockOwner: owner "${name}" requires an id`);
  }) as LockOwnerDef<N>;

  Object.defineProperties(ownerDef, {
    name: { value: name, enumerable: true },
    within: { value: within, enumerable: true },
  });

  return ownerDef;
}
