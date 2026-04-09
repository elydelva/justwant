/**
 * @justwant/flag — defineRule
 * Rule definition with config schema, context schema, and logic.
 */

import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { RuleDef } from "./types.js";

export interface DefineRuleConfig<N extends string, CConfig, CContext> {
  name: N;
  config?: StandardSchemaV1<unknown, CConfig>;
  context?: StandardSchemaV1<unknown, CContext>;
  defaultConfig?: CConfig;
  logic: (params: { config: CConfig; context: CContext }) => boolean | Promise<boolean>;
}

export function defineRule<N extends string, CConfig = unknown, CContext = unknown>(
  config: DefineRuleConfig<N, CConfig, CContext>
): RuleDef<N, CConfig, CContext> {
  return {
    name: config.name,
    config: config.config,
    context: config.context,
    defaultConfig: config.defaultConfig,
    logic: config.logic,
  };
}
