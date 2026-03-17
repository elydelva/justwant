/**
 * @justwant/flag — defineFlag
 * Flag definition with rules and strategy.
 */

import type { FlagDef, RuleDef } from "./types.js";

export interface DefineFlagConfig {
  id: string;
  default?: boolean;
  rules: RuleDef[];
  strategy?: "all" | "any";
}

export function defineFlag(config: DefineFlagConfig): FlagDef {
  return {
    id: config.id,
    default: config.default,
    rules: config.rules,
    strategy: config.strategy ?? "any",
  };
}
