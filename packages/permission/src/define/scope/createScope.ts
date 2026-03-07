/**
 * @justwant/permission — createScope
 * Defines a scope type. Singular = one global scope (0 arg). Plural = multiple instances (1 arg).
 * Infers literal type N from name for build-time type safety.
 */

import type { Scope } from "../../types/index.js";

export interface CreateScopeOptions<N extends string = string> {
  name: N;
}

export interface ScopeDef<N extends string = string> {
  readonly name: N;
  (): Scope<N>;
  (id: string): Scope<N>;
}

export function createScope<N extends string>(options: CreateScopeOptions<N>): ScopeDef<N> {
  const { name } = options;

  const scopeDef = ((id?: string): Scope<N> => {
    if (id === undefined) {
      return { type: name, id: null };
    }
    return { type: name, id };
  }) as ScopeDef<N>;

  Object.defineProperty(scopeDef, "name", { value: name, enumerable: true });

  return scopeDef;
}
