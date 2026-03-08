/**
 * @justwant/config — ValueDef
 * Definition of a value: which source and how to look it up.
 */

import type { ConfigSource } from "./ConfigSource.js";

export type ValueDef =
  | { from: ConfigSource; key: string }
  | { from: ConfigSource; path: string; field?: string };
