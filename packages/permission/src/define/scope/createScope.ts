/**
 * @justwant/permission — createScope
 * Defines a scope type. Singular = one global scope. Plural = multiple instances.
 * Infers literal type N from name for build-time type safety.
 */

import type { Scope } from "../../types/index.js";

export interface CreateScopeOptions<N extends string = string> {
  name: N;
  singular: boolean;
  within?: string;
}

export interface ScopeDef<N extends string = string> {
  readonly name: N;
  readonly singular: boolean;
  readonly within?: string;
  (): Scope<N>;
  (id: string): Scope<N>;
  (orgId: string, id: string): Scope<N>;
}

export function createScope<N extends string>(options: CreateScopeOptions<N>): ScopeDef<N> {
  const { name, singular, within } = options;

  const scopeDef = ((idOrOrgId?: string, id?: string): Scope<N> => {
    if (singular) {
      return { type: name, id: null };
    }
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
    throw new Error(`createScope: scope "${name}" requires an id (plural scope)`);
  }) as ScopeDef<N>;

  Object.defineProperties(scopeDef, {
    name: { value: name, enumerable: true },
    singular: { value: singular, enumerable: true },
    within: { value: within, enumerable: true },
  });

  return scopeDef;
}
