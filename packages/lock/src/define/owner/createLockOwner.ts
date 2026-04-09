/**
 * @justwant/lock — createLockOwner
 * Defines who can hold a lock (system, user, etc.).
 * Produces Actor with optional within (e.g. org, team).
 */

import type { Definable } from "@justwant/meta";
import type { LockOwner } from "../../types/index.js";

export interface CreateLockOwnerOptions<N extends string = string> {
  name: N;
  within?: string;
}

export interface LockOwnerDef<N extends string = string> extends Definable<N> {
  readonly name: N;
  readonly within?: string;
  (id: string): LockOwner<N>;
  (withinId: string, id: string): LockOwner<N>;
}

export function createLockOwner<N extends string>(
  options: CreateLockOwnerOptions<N>
): LockOwnerDef<N> {
  const { name, within } = options;

  const ownerDef = ((withinIdOrId?: string, id?: string): LockOwner<N> => {
    if (within && withinIdOrId !== undefined && id !== undefined) {
      return {
        type: name,
        id,
        within: { type: within, id: withinIdOrId },
      } as LockOwner<N>;
    }
    if (withinIdOrId !== undefined) {
      return {
        type: name,
        id: withinIdOrId,
      } as LockOwner<N>;
    }
    throw new Error(`createLockOwner: owner "${name}" requires an id`);
  }) as LockOwnerDef<N>;

  Object.defineProperties(ownerDef, {
    name: { value: name, enumerable: true },
    within: { value: within, enumerable: true },
  });

  return ownerDef;
}
