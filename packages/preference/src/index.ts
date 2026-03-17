/**
 * @justwant/preference — User preferences with typed schema
 */

export { createPreferenceService } from "./createPreferenceService.js";
export type {
  CreatePreferenceServiceOptions,
  PreferenceService,
  PreferenceSetEntry,
} from "./createPreferenceService.js";

export { definePreference } from "./definePreference.js";
export type { DefinePreferenceConfig } from "./definePreference.js";

export { createMemoryPreferenceAdapter } from "./adapters/memory.js";
export { createPreferenceDbAdapter } from "./adapters/db.js";
export type { PreferenceTable, CreatePreferenceDbAdapterOptions } from "./adapters/db.js";

export type {
  Actor,
  CreateInput,
  FindManyOptions,
  PreferenceDef,
  PreferenceEntry,
  PreferenceRepository,
} from "./types.js";

export {
  PreferenceError,
  PreferenceNotFoundError,
  PreferenceValidationError,
} from "./errors.js";
