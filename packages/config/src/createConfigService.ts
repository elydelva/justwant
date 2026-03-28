/**
 * @justwant/config — createConfigService
 * Runtime instance with full API. Resolves keys via waterfall from environment sources.
 */

import type { StandardSchemaV1 } from "@standard-schema/spec";
import { ConfigValidationError } from "./errors/index.js";
import { resolveValue } from "./resolve.js";
import type { EnvironmentDef, SourcesMap } from "./types/index.js";

export interface CreateConfigServiceOptions {
  environments: readonly EnvironmentDef[];
  defaultEnvironment?: string;
  validation?: { onError?: "throw" | "warn" | false };
}

export interface ConfigApi {
  get<T = unknown>(key: string): Promise<T>;
  get<T = unknown>(key: string, fallback: T): Promise<T>;
  has(key: string): Promise<boolean>;
}

function validateWithSchema(
  schema: StandardSchemaV1<unknown, unknown>,
  value: unknown
): { valid: boolean; value?: unknown; issues?: { message?: string }[] } {
  const std = (schema as { "~standard"?: { validate: (v: unknown) => unknown } })["~standard"];
  if (!std?.validate) return { valid: true, value };
  const result = std.validate(value);
  if (result && typeof (result as Promise<unknown>).then === "function") {
    return { valid: false, issues: [{ message: "Async validation not supported" }] };
  }
  const r = result as { value?: unknown; issues?: readonly { message?: string }[] };
  if (r.issues?.length) {
    return { valid: false, issues: r.issues as { message?: string }[] };
  }
  return { valid: true, value: r.value };
}

export function createConfigService(options: CreateConfigServiceOptions): ConfigApi {
  const { environments, defaultEnvironment, validation = {} } = options;
  const { onError = "throw" } = validation;

  const envMap = new Map<string, EnvironmentDef>();
  for (const env of environments) {
    envMap.set(env.name, env);
  }

  const activeEnvName = defaultEnvironment ?? environments[0]?.name;
  const activeEnv = activeEnvName ? envMap.get(activeEnvName) : undefined;

  if (!activeEnv) {
    throw new Error("No environment configured. Provide at least one environment.");
  }

  const env: EnvironmentDef = activeEnv;

  async function getValue(key: string): Promise<unknown> {
    const defs = (env.sources as SourcesMap)[key];
    if (!defs) return undefined;
    return resolveValue(defs);
  }

  return {
    async get<T = unknown>(key: string, fallback?: T): Promise<T> {
      const value = await getValue(key);
      if (value !== undefined) {
        const schema = env.schema?.[key];
        if (schema) {
          const { valid, value: validated, issues } = validateWithSchema(schema, value);
          if (!valid) {
            const errIssues = (issues ?? []).map((i) => ({
              key,
              message: i.message ?? "Validation failed",
            }));
            if (onError === "throw") throw new ConfigValidationError(errIssues);
            if (onError === "warn")
              console.warn("[config]", new ConfigValidationError(errIssues).message);
            return fallback as T;
          }
          return validated as T;
        }
        return value as T;
      }
      return fallback as T;
    },

    async has(key: string): Promise<boolean> {
      const value = await getValue(key);
      return value !== undefined;
    },
  };
}
