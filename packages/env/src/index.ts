/**
 * @justwant/env — Typed, validated environment variables.
 * Node.js / Bun: full support (files, watch).
 */
import {
  type CreateEnvOptions,
  type EnvSchema,
  type GroupSchema,
  createEnvWithDeps,
} from "./core.js";
import { mergeSources } from "./utils.js";
import { watchEnvFiles } from "./watcher.js";

function getCwd(): string {
  if (typeof process !== "undefined" && typeof process.cwd === "function") {
    return process.cwd();
  }
  return "";
}

function getNodeEnv(): string {
  if (typeof process !== "undefined" && process.env?.NODE_ENV) {
    return process.env.NODE_ENV;
  }
  return "development";
}

export type { CreateEnvOptions, EnvSchema, GroupSchema };
export type { CreateEnvResult, EnvInclude, InferEnv, InferGroupEnv } from "./core.js";

export interface DefineEnvOptions<T extends EnvSchema> {
  vars: T;
  /** Prefix for env keys (e.g. NEXT_PUBLIC_) — use when this env is safe for client */
  clientPrefix?: string | string[];
}

export function defineEnv<T extends EnvSchema>(options: DefineEnvOptions<T>) {
  return {
    vars: options.vars,
    clientPrefix: options.clientPrefix,
  };
}

export function createEnv<T extends EnvSchema, G extends GroupSchema | undefined = undefined>(
  options: CreateEnvOptions<T> & (G extends undefined ? object : { groups: G })
) {
  return createEnvWithDeps(options, {
    mergeSources,
    getCwd,
    getNodeEnv,
    watchEnvFiles,
  });
}

export { EnvironmentError } from "./errors.js";
export type { EnvIssue } from "./errors.js";
