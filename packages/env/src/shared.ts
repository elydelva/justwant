/**
 * Shared helpers used by both Node and Edge entry points.
 */
import type { EnvSchema } from "./core.js";

export function getCwd(): string {
  if (typeof process !== "undefined" && typeof process.cwd === "function") {
    return process.cwd();
  }
  return "";
}

export function getNodeEnv(): string {
  if (typeof process !== "undefined" && process.env?.NODE_ENV) {
    return process.env.NODE_ENV;
  }
  return "development";
}

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
