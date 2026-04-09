/**
 * @justwant/preference — definePreference
 * Portable preference definition without runtime dependencies.
 */

import type { PreferenceDef } from "./types.js";

export interface DefinePreferenceConfig<N extends string = string, T = unknown> {
  name: N;
  /** Storage key — defaults to name. */
  key?: string;
  schema?: PreferenceDef<N, T>["schema"];
  default?: T;
}

/**
 * Define a preference. Returns a callable PreferenceDef.
 * pref(actorId) → { type: N; id: actorId }
 */
export function definePreference<N extends string, T = unknown>(
  config: DefinePreferenceConfig<N, T>
): PreferenceDef<N, T> {
  const { name, schema } = config;
  const key = config.key ?? name;

  const prefDef = ((actorId: string) => ({ type: name, id: actorId })) as PreferenceDef<N, T>;

  Object.defineProperties(prefDef, {
    name: { value: name, enumerable: true },
    key: { value: key, enumerable: true },
    schema: { value: schema, enumerable: true },
    default: { value: config.default, enumerable: true },
  });

  return prefDef;
}
