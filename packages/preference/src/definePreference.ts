/**
 * @justwant/preference — definePreference
 * Portable preference definition without runtime dependencies.
 */

import type { PreferenceDef } from "./types.js";

export interface DefinePreferenceConfig<T = unknown> {
  id: string;
  /** Key for storage; defaults to id. */
  key?: string;
  /** Optional schema for value validation. */
  schema?: PreferenceDef<T>["schema"];
  /** Default value when not set. */
  default?: T;
}

/**
 * Define a preference. Returns a portable PreferenceDef.
 */
export function definePreference<T = unknown>(config: DefinePreferenceConfig<T>): PreferenceDef<T> {
  return {
    id: config.id,
    key: config.key ?? config.id,
    schema: config.schema,
    default: config.default,
  };
}
