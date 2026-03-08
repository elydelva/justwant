/**
 * @justwant/config — EnvironmentDef
 * Environment definition with sources map (logical key → value definitions).
 */

import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { ValueDef } from "./ValueDef.js";

export type SourcesMap = Record<string, ValueDef | ValueDef[]>;

export interface DefineEnvironmentOptions {
  name: string;
  sources: SourcesMap;
  schema?: Record<string, StandardSchemaV1<unknown, unknown>>;
}

export interface EnvironmentDef {
  readonly name: string;
  readonly sources: SourcesMap;
  readonly schema?: Record<string, StandardSchemaV1<unknown, unknown>>;
}
