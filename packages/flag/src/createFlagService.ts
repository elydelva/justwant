/**
 * @justwant/flag — createFlagService
 * Orchestrates repo for evaluate, getLatest, listConfigHistory, setConfigOverride, rollbackLastConfig.
 */

import { FlagValidationError } from "./errors.js";
import { evaluate as evaluateStandalone, resolveRuleId } from "./evaluate.js";
import type { ConfigOverride, FlagConfigRepo, FlagDef, FlagService, RuleDef } from "./types.js";

function validateConfig(
  schema: { "~standard"?: { validate: (v: unknown) => unknown } },
  value: unknown
): { valid: boolean; value?: unknown; issues?: { message?: string }[] } {
  const std = schema["~standard"];
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

export interface CreateFlagServiceOptions {
  flags: FlagDef[];
  repo: FlagConfigRepo;
}

export function createFlagService(options: CreateFlagServiceOptions): FlagService {
  const { flags, repo } = options;

  const ruleMap = new Map<string, RuleDef<unknown, unknown>>();
  for (const flag of flags) {
    for (const rule of flag.rules) {
      ruleMap.set(rule.id, rule);
    }
  }

  async function getLatest(rule: RuleDef | string): Promise<ConfigOverride | null> {
    const ruleId = resolveRuleId(rule);
    const ruleDef = typeof rule === "string" ? ruleMap.get(ruleId) : rule;

    for (;;) {
      const overrides = await repo.findMany(
        { ruleId, rolledBack: false },
        {
          orderBy: { field: "createdAt", direction: "desc" },
          limit: 1,
        }
      );
      const override = overrides[0];
      if (!override) return null;

      if (ruleDef?.config) {
        const { valid } = validateConfig(
          ruleDef.config as { "~standard"?: { validate: (v: unknown) => unknown } },
          override.config
        );
        if (!valid) {
          await repo.update(override.id, { rolledBack: true });
          continue;
        }
      }
      return override;
    }
  }

  const service: FlagService = {
    async evaluate(
      flag: FlagDef,
      context: unknown,
      configOverride?: Record<string, unknown>
    ): Promise<boolean> {
      const configByRuleId: Record<string, unknown> = {};
      for (const rule of flag.rules) {
        const remote = await getLatest(rule);
        const defaultConfig = rule.defaultConfig ?? {};
        const remoteConfig = remote?.config ?? {};
        const override = configOverride?.[rule.id] as Record<string, unknown> | undefined;
        const merged = {
          ...defaultConfig,
          ...remoteConfig,
          ...override,
        };
        if (rule.config) {
          const { valid, issues, value } = validateConfig(
            rule.config as { "~standard"?: { validate: (v: unknown) => unknown } },
            merged
          );
          if (!valid) {
            throw new FlagValidationError(
              `Config validation failed for rule ${rule.id}: ${(issues ?? []).map((i) => i.message).join(", ")}`,
              { ruleId: rule.id, issues }
            );
          }
          configByRuleId[rule.id] = value ?? merged;
        } else {
          configByRuleId[rule.id] = merged;
        }
      }
      return evaluateStandalone(flag, { context, configByRuleId });
    },

    getLatest,

    async listConfigHistory(
      rule: RuleDef | string,
      opts?: { limit?: number }
    ): Promise<ConfigOverride[]> {
      const ruleId = resolveRuleId(rule);
      return repo.findMany(
        { ruleId },
        {
          orderBy: { field: "createdAt", direction: "desc" },
          limit: opts?.limit ?? 50,
        }
      );
    },

    async setConfigOverride(rule: RuleDef | string, config: unknown): Promise<ConfigOverride> {
      const ruleId = resolveRuleId(rule);
      const ruleDef = typeof rule === "string" ? ruleMap.get(ruleId) : rule;

      if (ruleDef?.config) {
        const { valid, issues } = validateConfig(
          ruleDef.config as { "~standard"?: { validate: (v: unknown) => unknown } },
          config
        );
        if (!valid) {
          throw new FlagValidationError(
            `Config validation failed: ${(issues ?? []).map((i) => i.message).join(", ")}`,
            { ruleId, issues }
          );
        }
      }

      return repo.create({
        ruleId,
        config: config as Record<string, unknown>,
        rolledBack: false,
      });
    },

    async rollbackLastConfig(rule: RuleDef | string): Promise<void> {
      const latest = await getLatest(rule);
      if (latest) {
        await repo.update(latest.id, { rolledBack: true });
      }
    },
  };

  return service;
}
