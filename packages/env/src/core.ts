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

function resolveRawValue(
  internalKey: string,
  prefix: string | string[] | undefined,
  merged: Record<string, string>
): string {
  let prefixes: string[];
  if (!prefix) prefixes = [];
  else if (Array.isArray(prefix)) prefixes = prefix;
  else prefixes = [prefix];
  const primaryKey = prefixes.length > 0 ? prefixes[0] + internalKey : internalKey;
  let raw = merged[primaryKey] ?? merged[internalKey];
  if (raw === undefined) {
    for (const p of prefixes) {
      raw = merged[p + internalKey];
      if (raw !== undefined) break;
    }
  }
  return raw ?? "";
}

function validateVar(
  internalKey: string,
  schema: EnvSchema[string],
  prefix: string | string[] | undefined,
  merged: Record<string, string>
): { rawValue: string; validatedValue?: unknown; issues: { key: string; message: string }[] } {
  const rawValue = resolveRawValue(internalKey, prefix, merged);

  const std = (schema as { "~standard"?: { validate: (v: unknown) => unknown } })["~standard"];
  if (!std?.validate) {
    return {
      rawValue,
      issues: [{ key: internalKey, message: "Schema does not implement Standard Schema" }],
    };
  }

  const result = std.validate(rawValue !== "" ? rawValue : undefined) as
    | { value?: unknown; issues?: readonly { message?: string }[] }
    | Promise<unknown>;

  if (result && typeof (result as Promise<unknown>).then === "function") {
    return {
      rawValue,
      issues: [{ key: internalKey, message: "Async validation not supported for env" }],
    };
  }

  const r = result as { value?: unknown; issues?: readonly { message?: string }[] };
  if (r.issues) {
    return { rawValue, issues: formatSchemaIssues(internalKey, r.issues) };
  }
  return { rawValue, validatedValue: r.value, issues: [] };
}

function validateGroupVar(
  envKey: string,
  groupKey: string,
  schema: EnvSchema[string],
  merged: Record<string, string>,
  clientPrefix: string | string[] | undefined
): { rawValue: string; validatedValue?: unknown; issues: { key: string; message: string }[] } {
  let rawValue = merged[envKey];
  if (rawValue === undefined && clientPrefix) {
    for (const p of Array.isArray(clientPrefix) ? clientPrefix : [clientPrefix]) {
      rawValue = merged[p + envKey];
      if (rawValue !== undefined) break;
    }
  }
  rawValue = rawValue ?? "";

  const std = (schema as { "~standard"?: { validate: (v: unknown) => unknown } })["~standard"];
  if (!std?.validate) {
    return {
      rawValue,
      issues: [{ key: groupKey, message: "Schema does not implement Standard Schema" }],
    };
  }

  const result = std.validate(rawValue || undefined) as
    | { value?: unknown; issues?: readonly { message?: string }[] }
    | Promise<unknown>;

  if (result && typeof (result as Promise<unknown>).then === "function") {
    return {
      rawValue,
      issues: [{ key: groupKey, message: "Async validation not supported for env" }],
    };
  }

  const r = result as { value?: unknown; issues?: readonly { message?: string }[] };
  if (r.issues) return { rawValue, issues: formatSchemaIssues(groupKey, r.issues) };
  return { rawValue, validatedValue: r.value, issues: [] };
}

function applyGroupVars(
  groupKeys: Map<string, { group: string; key: string }>,
  groups: GroupSchema,
  merged: Record<string, string>,
  clientPrefix: string | string[] | undefined,
  validated: Record<string, unknown>,
  raw: Record<string, string>,
  issues: { key: string; message: string }[]
): void {
  for (const [envKey, { group, key }] of groupKeys) {
    const schema = groups[group]?.[key];
    if (!schema) continue;
    const groupKey = `${group}.${key}`;
    const {
      rawValue,
      validatedValue,
      issues: varIssues,
    } = validateGroupVar(envKey, groupKey, schema, merged, clientPrefix);
    raw[groupKey] = rawValue;
    issues.push(...varIssues);
    if (varIssues.length === 0 && validatedValue !== undefined) {
      if (!validated[group]) (validated[group] as Record<string, unknown>) = {};
      (validated[group] as Record<string, unknown>)[key] = validatedValue;
    }
  }
}

function checkModeRequirements(
  modeRequirements: readonly (string | number | symbol)[],
  validated: Record<string, unknown>,
  mode: string,
  issues: { key: string; message: string }[]
): void {
  for (const req of modeRequirements) {
    const k = String(req);
    if (k in validated) continue;
    const [g, gkey] = k.split(".");
    const has = g && gkey ? (validated[g] as Record<string, unknown>)?.[gkey] !== undefined : false;
    if (!has) issues.push({ key: k, message: `Required for mode ${mode}` });
  }
}

function reportIssues(
  issues: { key: string; message: string }[],
  skip: boolean,
  onError: "throw" | "warn" | "silent" | false,
  reporter: ((issues: { key: string; message: string }[]) => void) | undefined
): void {
  if (skip || issues.length === 0) return;
  if (onError === "throw") throw new EnvironmentError(issues);
  if (reporter) reporter(issues);
  else if (onError === "warn") console.warn("[env]", new EnvironmentError(issues).message);
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
      const {
        rawValue,
        validatedValue,
        issues: varIssues,
      } = validateVar(internalKey, entry.schema, entry.prefix, merged);
      raw[internalKey] = rawValue;
      issues.push(...varIssues);
      if (varIssues.length === 0 && validatedValue !== undefined)
        validated[internalKey] = validatedValue;
    }

    if (groups && groupKeys) {
      applyGroupVars(groupKeys, groups, merged, clientPrefix, validated, raw, issues);
    }

    if (modes && mode && modes[mode]) {
      checkModeRequirements(modes[mode], validated, mode, issues);
    }

    reportIssues(issues, skip, onError, reporter);

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
