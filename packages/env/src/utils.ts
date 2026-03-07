import { expandRecord } from "./expand.js";
import { loadEnvFile } from "./parser.js";

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
  cwd: string,
  expand: boolean
): Record<string, string> {
  const result: Record<string, string> = {};

  // 1. Files (lowest priority first)
  const files = config.files ?? defaultFiles();
  for (const file of files) {
    const loaded = loadEnvFile(file, cwd);
    for (const [k, v] of Object.entries(loaded)) {
      result[k] = v;
    }
  }

  // 2. process.env (or custom env object for edge runtimes / CF Workers)
  if (config.processEnv !== false) {
    const env =
      typeof config.processEnv === "object" && config.processEnv !== null
        ? config.processEnv
        : getProcessEnv();
    for (const [k, v] of Object.entries(env)) {
      if (v !== undefined) result[k] = v;
    }
  }

  // 3. Inline (highest priority)
  if (config.inline) {
    for (const [k, v] of Object.entries(config.inline)) {
      result[k] = v;
    }
  }

  return expandRecord(result, expand);
}

function defaultFiles(): string[] {
  const nodeEnv =
    typeof process !== "undefined" && process.env?.NODE_ENV ? process.env.NODE_ENV : "development";
  return [".env", ".env.local", `.env.${nodeEnv}`, `.env.${nodeEnv}.local`];
}
