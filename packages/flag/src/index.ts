/**
 * @justwant/flag — Feature flags core
 * defineRule, defineFlag, createFlagService.
 * Rollout helpers: @justwant/flag/helpers
 */

export { createFlagService } from "./createFlagService.js";
export type { CreateFlagServiceOptions } from "./createFlagService.js";
export { createMemoryFlagConfigRepo } from "./createMemoryFlagConfigRepo.js";
export { defineFlag } from "./defineFlag.js";
export type { DefineFlagConfig } from "./defineFlag.js";
export type { FeatureDef } from "@justwant/feature";
export { defineRule } from "./defineRule.js";
export type { DefineRuleConfig } from "./defineRule.js";

export { FlagError, FlagValidationError, RuleNotFoundError } from "./errors.js";
export type {
  ConfigOverride,
  CreateInput,
  EvaluateConfigOverride,
  FindManyOptions,
  FlagConfigRepo,
  FlagDef,
  FlagService,
  RuleDef,
  RuleRef,
} from "./types.js";
