/**
 * @justwant/flag — evaluate
 * Standalone evaluation with configByRuleId. Shared logic for createFlagService.
 */

import type { FlagDef, RuleDef } from "./types.js";

export interface EvaluateParams {
  context: unknown;
  configByRuleId: Record<string, unknown>;
}

function resolveRuleId(rule: { id: string } | string): string {
  return typeof rule === "string" ? rule : rule.name;
}

function getConfigForRule(rule: RuleDef, configByRuleId: Record<string, unknown>): unknown {
  const override = configByRuleId[rule.name];
  const defaultConfig = rule.defaultConfig ?? {};
  if (override == null) return defaultConfig;
  return { ...defaultConfig, ...(override as Record<string, unknown>) };
}

/**
 * Evaluate a flag with explicit configByRuleId (no repo).
 * For tests and in-memory config.
 */
export async function evaluate(flag: FlagDef, params: EvaluateParams): Promise<boolean> {
  const { context, configByRuleId } = params;
  const strategy = flag.strategy ?? "any";

  if (flag.rules.length === 0) {
    return flag.default ?? false;
  }

  const results: boolean[] = [];
  for (const rule of flag.rules) {
    const config = getConfigForRule(rule, configByRuleId);
    const result = await rule.logic({
      config: config as never,
      context: context as never,
    });
    results.push(result);
  }

  if (strategy === "all") {
    return results.every(Boolean);
  }
  return results.some(Boolean);
}

export { resolveRuleId, getConfigForRule };
