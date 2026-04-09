/**
 * @justwant/flag — Core types
 * FlagDef, RuleDef, FlagConfigRepo, ConfigOverride.
 */

import type { FeatureDef } from "@justwant/feature";
import type { Inspectable } from "@justwant/meta";
import type { StandardSchemaV1 } from "@standard-schema/spec";

/** Config override — persisted entity. Soft delete via rolledBack. */
export interface ConfigOverride {
  id: string;
  ruleId: string;
  config: Record<string, unknown>;
  rolledBack: boolean;
  createdAt: Date;
}

export type CreateInput<T> = Omit<T, "id" | "createdAt"> & {
  id?: string;
  createdAt?: Date;
  rolledBack?: boolean;
};

export interface FindManyOptions {
  limit?: number;
  offset?: number;
  orderBy?: { field: keyof ConfigOverride; direction: "asc" | "desc" };
}

export interface FlagConfigRepo {
  create(data: CreateInput<ConfigOverride>): Promise<ConfigOverride>;
  findOne(where: Partial<ConfigOverride>): Promise<ConfigOverride | null>;
  findMany(where: Partial<ConfigOverride>, opts?: FindManyOptions): Promise<ConfigOverride[]>;
  count(where: Partial<ConfigOverride>): Promise<number>;
  update(id: string, data: { rolledBack: boolean }): Promise<ConfigOverride>;
}

/** Rule definition — config schema, context schema, logic. */
export interface RuleDef<N extends string = string, CConfig = unknown, CContext = unknown>
  extends Inspectable<N> {
  readonly name: N;
  readonly config?: StandardSchemaV1<unknown, CConfig>;
  readonly context?: StandardSchemaV1<unknown, CContext>;
  readonly defaultConfig?: CConfig;
  readonly logic: (params: {
    config: CConfig;
    context: CContext;
  }) => boolean | Promise<boolean>;
}

/** Flag definition — feature entity + rules + strategy. */
export interface FlagDef<N extends string = string> extends Inspectable<N> {
  readonly feature: FeatureDef<N>;
  readonly name: N;
  readonly default?: boolean;
  readonly rules: readonly RuleDef[];
  readonly strategy?: "all" | "any";
}

/** Rule reference for service methods (RuleDef or rule name string). */
export type RuleRef = RuleDef | string;

/** Config override per ruleId for evaluate (ad-hoc, does not persist). */
export type EvaluateConfigOverride = Record<string, unknown>;

/** Flag service API. */
export interface FlagService {
  evaluate(
    flag: FlagDef,
    context: unknown,
    configOverride?: EvaluateConfigOverride
  ): Promise<boolean>;
  getLatest(rule: RuleRef): Promise<ConfigOverride | null>;
  listConfigHistory(rule: RuleRef, opts?: { limit?: number }): Promise<ConfigOverride[]>;
  setConfigOverride(rule: RuleRef, config: unknown): Promise<ConfigOverride>;
  rollbackLastConfig(rule: RuleRef): Promise<void>;
}
