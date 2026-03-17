/**
 * @justwant/flag — defineRule
 * Rule definition with config schema, context schema, and logic.
 */

import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { RuleDef } from "./types.js";

export interface DefineRuleConfig<CConfig, CContext> {
  id: string;
  config?: StandardSchemaV1<unknown, CConfig>;
  context?: StandardSchemaV1<unknown, CContext>;
  defaultConfig?: CConfig;
  logic: (params: { config: CConfig; context: CContext }) => boolean | Promise<boolean>;
}

export function defineRule<CConfig = unknown, CContext = unknown>(
  config: DefineRuleConfig<CConfig, CContext>
): RuleDef<CConfig, CContext> {
  return {
    id: config.id,
    config: config.config,
    context: config.context,
    defaultConfig: config.defaultConfig,
    logic: config.logic,
  };
}
