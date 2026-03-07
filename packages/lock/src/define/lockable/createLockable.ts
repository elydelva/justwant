/**
 * @justwant/lock — createLockable
 * Defines what can be locked. Singular = one global key. Plural = key per params.
 * Infers literal type N from name for build-time type safety.
 */

import { LockableParamsError } from "../../errors/index.js";
import { serializeParams } from "../../key.js";
import type { Lockable } from "../../types/index.js";

export interface CreateLockableOptions<N extends string = string> {
  name: N;
  singular: boolean;
  prefix?: string;
}

export interface LockableDef<N extends string = string> {
  readonly name: N;
  readonly singular: boolean;
  readonly prefix?: string;
  (): Lockable<N>;
  (params: string): Lockable<N>;
  (params: Record<string, string>): Lockable<N>;
}

function buildKey(prefix: string, name: string, paramsPart: string): string {
  const parts = prefix ? [prefix, name, paramsPart] : [name, paramsPart];
  return parts.filter(Boolean).join(":");
}

export function createLockable<N extends string>(
  options: CreateLockableOptions<N>
): LockableDef<N> {
  const { name, singular, prefix = "" } = options;

  const lockableDef = ((params?: string | Record<string, string>): Lockable<N> => {
    if (singular) {
      if (params !== undefined && params !== null) {
        throw new LockableParamsError(
          `createLockable: lockable "${name}" is singular and does not accept params`,
          name,
          "singular_with_params"
        );
      }
      const key = buildKey(prefix, name, "");
      return { type: name, key };
    }
    if (params === undefined || params === null) {
      throw new LockableParamsError(
        `createLockable: lockable "${name}" requires params (plural lockable)`,
        name,
        "plural_without_params"
      );
    }
    const paramsPart = serializeParams(params);
    const key = buildKey(prefix, name, paramsPart);
    return { type: name, key };
  }) as LockableDef<N>;

  Object.defineProperties(lockableDef, {
    name: { value: name, enumerable: true },
    singular: { value: singular, enumerable: true },
    prefix: { value: prefix || undefined, enumerable: true },
  });

  return lockableDef;
}
