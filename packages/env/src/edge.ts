/**
 * @justwant/env/edge — Edge-compatible build.
 * No fs, no node:path. Use for Cloudflare Workers, Vercel Edge, Deno Deploy.
 * processEnv can be an object (e.g. ctx.env) when process.env is unavailable.
 */
import { type CreateEnvOptions, type EnvSchema, type GroupSchema, createEnvWithDeps } from "./core.js";
import { getCwd, getNodeEnv } from "./shared.js";
import { mergeSources } from "./utils-edge.js";

export type {
  CreateEnvOptions,
  CreateEnvResult,
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
    // No watchEnvFiles — file watching unavailable in edge runtimes
  });
}

export { EnvironmentError } from "./errors.js";
export type { EnvIssue } from "./errors.js";
