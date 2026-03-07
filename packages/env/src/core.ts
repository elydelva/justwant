/**
 * Shared createEnv logic — used by both Node and Edge entry points.
 */
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { EnvironmentError, formatSchemaIssues } from "./errors.js";
import { redactRecord } from "./redact.js";

export type EnvSchema = Record<string, StandardSchemaV1<unknown, unknown>>;
export type GroupSchema = Record<string, EnvSchema>;

export interface SourceConfig {
  files?: string[];
  processEnv?: boolean | Record<string, string | undefined>;
  inline?: Record<string, string>;
}

/** Result of defineEnv — can be passed to createEnv's include */
export interface EnvInclude<T extends EnvSchema = EnvSchema> {
  vars: T;
  clientPrefix?: string | string[];
}

export interface CreateEnvOptions<T extends EnvSchema> {
  /** Merge vars from other defineEnv results (e.g. client env to avoid redundancy) */
  include?: EnvInclude[];
  vars?: T;
  groups?: GroupSchema;
  groupSeparator?: string;
  sources?: {
    files?: string[];
    processEnv?: boolean | Record<string, string | undefined>;
    inline?: Record<string, string>;
  };
  cwd?: string;
  expand?: boolean;
  clientPrefix?: string | string[];
  modes?: Record<string, (string | number | symbol)[]>;
  mode?: string;
  redact?: string[] | RegExp;
  validation?: {
    onError?: "throw" | "warn" | "silent" | false;
    skip?: boolean;
    reporter?: (issues: { key: string; message: string }[]) => void;
  };
  watch?: boolean;
  onReload?: (changed: string[]) => void;
}

export type InferEnv<T extends EnvSchema> = {
  [K in keyof T]: T[K] extends StandardSchemaV1<unknown, infer O> ? O : never;
};

export type InferGroupEnv<G extends GroupSchema> = {
  [Group in keyof G]: {
    [K in keyof G[Group]]: G[Group][K] extends StandardSchemaV1<unknown, infer O> ? O : never;
  };
};

export interface EnvProxy {
  get(key: string): unknown;
  get(key: string, fallback: unknown): unknown;
  has(key: string): boolean;
  raw(key: string): string | undefined;
  toJSON(): Record<string, unknown>;
}

export type CreateEnvResult<
  T extends EnvSchema,
  G extends GroupSchema | undefined,
> = (G extends GroupSchema ? InferGroupEnv<G> : object) & InferEnv<T> & EnvProxy;

export type MergeSourcesFn = (
  config: SourceConfig,
  cwd: string,
  expand: boolean
) => Record<string, string>;

export interface CreateEnvDeps {
  mergeSources: MergeSourcesFn;
  getCwd: () => string;
  getNodeEnv: () => string;
  watchEnvFiles?: (
    cwd: string,
    files: string[],
    onChange: (changed: string[]) => void
  ) => () => void;
}

function createEnvProxy(
  validated: Record<string, unknown>,
  raw: Record<string, string>,
  redact: string[] | RegExp | undefined
): EnvProxy {
  return {
    get(key: string, fallback?: unknown): unknown {
      if (key.includes(".")) {
        const parts = key.split(".");
        const g = parts[0];
        const k = parts[1];
        if (!g || k === undefined) return fallback;
        const group = (validated[g] as Record<string, unknown>) ?? {};
        const v = group[k];
        return v !== undefined ? v : fallback;
      }
      const v = validated[key];
      return v !== undefined ? v : fallback;
    },
    has(key: string): boolean {
      if (key.includes(".")) {
        const parts = key.split(".");
        const g = parts[0];
        const k = parts[1];
        if (!g || k === undefined) return false;
        const group = validated[g] as Record<string, unknown> | undefined;
        return group ? k in group : false;
      }
      return key in validated;
    },
    raw(key: string): string | undefined {
      return raw[key];
    },
    toJSON(): Record<string, unknown> {
      return redactRecord(validated, redact);
    },
  };
}

function collectKeysFromGroups(
  groups: GroupSchema,
  groupSeparator: string
): Map<string, { group: string; key: string }> {
  const map = new Map<string, { group: string; key: string }>();
  for (const [groupName, schema] of Object.entries(groups)) {
    const prefix = groupName.toUpperCase() + groupSeparator;
    for (const k of Object.keys(schema)) {
      map.set(prefix + k.toUpperCase(), { group: groupName, key: k });
    }
  }
  return map;
}

export function createEnvWithDeps<
  T extends EnvSchema,
  G extends GroupSchema | undefined = undefined,
>(
  options: CreateEnvOptions<T> & (G extends undefined ? object : { groups: G }),
  deps: CreateEnvDeps
): CreateEnvResult<T, G> {
  const {
    include = [],
    vars = {} as T,
    groups,
    groupSeparator = "_",
    sources,
    cwd = deps.getCwd(),
    expand = true,
    clientPrefix,
    modes,
    mode = deps.getNodeEnv(),
    redact,
    validation = {},
    watch: watchFiles = false,
    onReload,
  } = options;

  const { onError = "throw", skip = false, reporter } = validation;
  const { mergeSources, watchEnvFiles } = deps;

  // Merge: include vars (with their prefix) + local vars (with global clientPrefix)
  // Each entry: { schema, prefix? } — per-var prefix from include, or global clientPrefix for local vars
  const mergedVars = new Map<string, { schema: EnvSchema[string]; prefix?: string | string[] }>();
  for (const inc of include) {
    for (const [k, schema] of Object.entries(inc.vars)) {
      mergedVars.set(k, { schema, prefix: inc.clientPrefix });
    }
  }
  for (const [k, schema] of Object.entries(vars)) {
    mergedVars.set(k, { schema, prefix: clientPrefix });
  }

  const groupKeys = groups ? collectKeysFromGroups(groups, groupSeparator) : null;
  const flatKeys = [...mergedVars.keys()];

  function loadAndValidate(): {
    validated: Record<string, unknown>;
    raw: Record<string, string>;
  } {
    const merged = mergeSources(sources ?? {}, cwd, expand);

    const validated: Record<string, unknown> = {};
    const raw: Record<string, string> = {};
    const issues: { key: string; message: string }[] = [];

    for (const internalKey of flatKeys) {
      const entry = mergedVars.get(internalKey);
      if (!entry) continue;
      const { schema, prefix } = entry;
      const envKey = prefix
        ? (Array.isArray(prefix) ? prefix[0] : prefix) + internalKey
        : internalKey;
      let rawValue = merged[envKey] ?? merged[internalKey];
      if (!rawValue && prefix) {
        for (const p of Array.isArray(prefix) ? prefix : [prefix]) {
          rawValue = merged[p + internalKey];
          if (rawValue !== undefined) break;
        }
      }

      raw[internalKey] = rawValue ?? "";
      const std = (schema as { "~standard"?: { validate: (v: unknown) => unknown } })["~standard"];
      if (!std?.validate) {
        issues.push({ key: internalKey, message: "Schema does not implement Standard Schema" });
        continue;
      }

      const result = std.validate(
        rawValue !== undefined && rawValue !== "" ? rawValue : undefined
      ) as
        | { value?: unknown; issues?: readonly { message?: string }[] }
        | Promise<{ value?: unknown; issues?: readonly { message?: string }[] }>;

      if (result && typeof (result as Promise<unknown>).then === "function") {
        issues.push({ key: internalKey, message: "Async validation not supported for env" });
      } else {
        const r = result as { value?: unknown; issues?: readonly { message?: string }[] };
        if (r.issues) {
          for (const i of formatSchemaIssues(internalKey, r.issues)) {
            issues.push(i);
          }
        } else if ("value" in r) {
          validated[internalKey] = r.value;
        }
      }
    }

    if (groups && groupKeys) {
      for (const [envKey, { group, key }] of groupKeys) {
        const schema = groups[group]?.[key];
        if (!schema) continue;

        let rawValue = merged[envKey];
        if (rawValue === undefined && clientPrefix) {
          for (const p of Array.isArray(clientPrefix) ? clientPrefix : [clientPrefix]) {
            rawValue = merged[p + envKey];
            if (rawValue !== undefined) break;
          }
        }

        raw[`${group}.${key}`] = rawValue ?? "";

        const std = (schema as { "~standard"?: { validate: (v: unknown) => unknown } })[
          "~standard"
        ];
        if (!std?.validate) continue;

        const result = std.validate(rawValue ?? undefined) as
          | { value?: unknown; issues?: readonly { message?: string }[] }
          | Promise<unknown>;

        if (result && typeof (result as Promise<unknown>).then === "function") continue;
        const r = result as { value?: unknown; issues?: readonly { message?: string }[] };
        if (r.issues) {
          for (const iss of formatSchemaIssues(`${group}.${key}`, r.issues)) {
            issues.push(iss);
          }
        } else if ("value" in r) {
          if (!validated[group]) (validated[group] as Record<string, unknown>) = {};
          (validated[group] as Record<string, unknown>)[key] = r.value;
        }
      }
    }

    if (modes && mode && modes[mode]) {
      for (const req of modes[mode]) {
        const k = String(req);
        const hasFlat = k in validated;
        const hasGroup = groups && k.includes(".");
        if (!hasFlat && !hasGroup) {
          const [g, key] = k.split(".");
          const has =
            g && key ? (validated[g] as Record<string, unknown>)?.[key] !== undefined : false;
          if (!has) issues.push({ key: k, message: `Required for mode ${mode}` });
        }
      }
    }

    if (!skip && issues.length > 0) {
      if (onError === "throw") throw new EnvironmentError(issues);
      if (reporter) reporter(issues);
      else if (onError === "warn") console.warn("[env]", new EnvironmentError(issues).message);
    }

    return { validated, raw };
  }

  let state = loadAndValidate();
  const proxy = createEnvProxy(state.validated, state.raw, redact);

  const result = Object.assign(
    Object.create(proxy) as CreateEnvResult<T, G>,
    state.validated as Record<string, unknown>
  );

  if (watchFiles && onReload && watchEnvFiles) {
    const nodeEnv = deps.getNodeEnv();
    const files = sources?.files ?? [
      ".env",
      ".env.local",
      `.env.${nodeEnv}`,
      `.env.${nodeEnv}.local`,
    ];
    watchEnvFiles(cwd, files, (changed) => {
      state = loadAndValidate();
      onReload(changed);
    });
  }

  return result;
}
