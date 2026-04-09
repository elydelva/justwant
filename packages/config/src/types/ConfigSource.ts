/**
 * @justwant/config — ConfigSource
 * Common interface for all config sources (env, json, database, vault, etc.)
 */

import type { SourceLookup } from "./SourceLookup.js";

export interface ConfigSource {
  get(lookup: SourceLookup): unknown;
}
