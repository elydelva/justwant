/**
 * Edge-compatible merge: no fs, no node:path.
 * For Cloudflare Workers, Vercel Edge, Deno Deploy, etc.
 */
import { expandRecord } from "./expand.js";

export interface SourceConfig {
  files?: string[];
  processEnv?: boolean | Record<string, string | undefined>;
  inline?: Record<string, string>;
}

function getProcessEnv(): Record<string, string | undefined> {
  if (typeof process !== "undefined" && process.env) {
    return process.env as Record<string, string | undefined>;
  }
  return {};
}

export function mergeSources(
  config: SourceConfig,
  _cwd: string,
  expand: boolean
): Record<string, string> {
  const result: Record<string, string> = {};

  // Files: not available in edge runtimes (no fs). Use processEnv or inline.

  // processEnv
  const processEnv = config.processEnv;
  if (processEnv !== false) {
    const env =
      typeof processEnv === "object" && processEnv !== null ? processEnv : getProcessEnv();
    for (const [k, v] of Object.entries(env)) {
      if (v !== undefined) result[k] = v;
    }
  }

  // inline
  if (config.inline) {
    for (const [k, v] of Object.entries(config.inline)) {
      result[k] = v;
    }
  }

  return expandRecord(result, expand);
}
