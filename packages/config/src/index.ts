/**
 * @justwant/config — Config applicative multi-source avec merge ordonné et typage fort
 */

export { defineValue } from "./defineValue.js";
export { defineEnvironment, type DefineEnvironmentOptions } from "./defineEnvironment.js";
export { createConfigService } from "./createConfigService.js";
export type { CreateConfigServiceOptions, ConfigApi } from "./createConfigService.js";

export type {
  ConfigSource,
  SourceLookup,
  ValueDef,
  EnvironmentDef,
  SourcesMap,
} from "./types/index.js";

export { ConfigError, ConfigValidationError } from "./errors/index.js";
