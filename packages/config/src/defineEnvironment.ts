/**
 * @justwant/config — defineEnvironment
 * Defines an environment with sources map (logical key → value definitions).
 */

import type { DefineEnvironmentOptions, EnvironmentDef } from "./types/index.js";

export type { DefineEnvironmentOptions } from "./types/index.js";

export function defineEnvironment(options: DefineEnvironmentOptions): EnvironmentDef {
  return {
    get name() {
      return options.name;
    },
    get sources() {
      return options.sources;
    },
    get schema() {
      return options.schema;
    },
  };
}
