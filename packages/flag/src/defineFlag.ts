/**
 * @justwant/flag — defineFlag
 * Attaches evaluation rules to a FeatureDef.
 */

import type { FeatureDef } from "@justwant/feature";
import type { FlagDef, RuleDef } from "./types.js";

export interface DefineFlagConfig {
  default?: boolean;
  rules: RuleDef[];
  strategy?: "all" | "any";
}

export function defineFlag<N extends string>(
  feature: FeatureDef<N>,
  config: DefineFlagConfig
): FlagDef {
  return {
    feature,
    id: feature.name,
    default: config.default,
    rules: config.rules,
    strategy: config.strategy ?? "any",
  };
}
