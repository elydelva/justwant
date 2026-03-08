/**
 * @justwant/config — defineEnvSource
 * Source that reads from process.env (or env-like object).
 */

import type { ConfigSource, SourceLookup } from "../types/index.js";

export interface DefineEnvSourceOptions {
  /** Prefix for env keys (e.g. "APP_" → APP_DATABASE_URL) */
  prefix?: string;
  /** Custom env object (default: process.env) */
  env?: Record<string, string | undefined>;
}

function getEnv(options: DefineEnvSourceOptions): Record<string, string | undefined> {
  if (options.env !== undefined) return options.env;
  if (typeof process !== "undefined" && process.env)
    return process.env as Record<string, string | undefined>;
  return {};
}

export function defineEnvSource(options: DefineEnvSourceOptions = {}): ConfigSource {
  const prefix = options.prefix ?? "";

  return {
    get(lookup: SourceLookup): unknown {
      if (!("key" in lookup)) return undefined;
      const env = getEnv(options);
      const key = prefix ? prefix + lookup.key : lookup.key;
      const value = env[key];
      return value !== undefined && value !== "" ? value : undefined;
    },
  };
}
