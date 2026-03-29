/**
 * @justwant/env — Typed, validated environment variables.
 * Node.js / Bun: full support (files, watch).
 */
import { type CreateEnvOptions, type EnvSchema, type GroupSchema, createEnvWithDeps } from "./core.js";
import { getCwd, getNodeEnv } from "./shared.js";
import { mergeSources } from "./utils.js";
import { watchEnvFiles } from "./watcher.js";

export type {
  CreateEnvOptions,
  CreateEnvResult,
  EnvInclude,
  EnvSchema,
  GroupSchema,
  InferEnv,
  InferGroupEnv,
} from "./core.js";
export { defineEnv } from "./shared.js";
export type { DefineEnvOptions } from "./shared.js";

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
