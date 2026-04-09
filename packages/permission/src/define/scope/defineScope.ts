/**
 * @justwant/permission — defineScope
 * Defines a scope type. Singular = one global scope (0 arg). Plural = multiple instances (1 arg).
 * Infers literal type N from name for build-time type safety.
 */

import type { Inspectable } from "@justwant/meta";
import type { Scope } from "../../types/index.js";

export interface DefineScopeOptions<N extends string = string> {
  name: N;
}

export interface ScopeDef<N extends string = string> extends Inspectable<N> {
  readonly name: N;
  (): Scope<N>;
  (id: string): Scope<N>;
}

export function defineScope<N extends string>(options: DefineScopeOptions<N>): ScopeDef<N> {
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
