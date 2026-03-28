/**
 * @justwant/env/edge — Edge-compatible build.
 * No fs, no node:path. Use for Cloudflare Workers, Vercel Edge, Deno Deploy.
 * processEnv can be an object (e.g. ctx.env) when process.env is unavailable.
 */
import {
  type CreateEnvOptions,
  type CreateEnvResult,
  type EnvSchema,
  type GroupSchema,
  type InferEnv,
  type InferGroupEnv,
  createEnvWithDeps,
} from "./core.js";
import { mergeSources } from "./utils-edge.js";

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

export type { CreateEnvOptions, CreateEnvResult, EnvSchema, GroupSchema, InferEnv, InferGroupEnv };

export interface DefineEnvOptions<T extends EnvSchema> {
  vars: T;
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
    // No watchEnvFiles — file watching unavailable in edge runtimes
  });
}

export { EnvironmentError } from "./errors.js";
export type { EnvIssue } from "./errors.js";
