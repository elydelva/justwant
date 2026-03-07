/**
 * Type-safe mapping between Drizzle table columns and adapter contract.
 *
 * @see docs/03-mapping.md
 */

import type { AnyContract, InferContract } from "@justwant/adapter";
import type { Table } from "drizzle-orm";
import type { ColData } from "./drizzle-types.js";

/** Columns that can provide data of type T (exact or nullable). */
type ColsFor<TTable extends Table, T> = {
  [K in keyof TTable["_"]["columns"]]: ColData<TTable["_"]["columns"][K]> extends T
    ? TTable["_"]["columns"][K]
    : ColData<TTable["_"]["columns"][K]> extends T | null
      ? TTable["_"]["columns"][K]
      : never;
}[keyof TTable["_"]["columns"]];

/** Required fields: each contract key maps to a compatible column. */
export type RequiredMapping<TTable extends Table, TContract extends AnyContract> = {
  [K in keyof TContract as TContract[K]["_required"] extends true ? K : never]: ColsFor<
    TTable,
    TContract[K]["_type"]
  >;
};

/** Optional fields: each contract key maps to a compatible column. */
export type OptionalMapping<TTable extends Table, TContract extends AnyContract> = {
  [K in keyof TContract as TContract[K]["_required"] extends false ? K : never]?: ColsFor<
    TTable,
    TContract[K]["_type"]
  >;
};

/** Full mapping: required + optional. */
export type MappingFor<TTable extends Table, TContract extends AnyContract> = RequiredMapping<
  TTable,
  TContract
> &
  OptionalMapping<TTable, TContract>;

/** Alias for MappingFor. */
export type TableMapping<TTable extends Table, TContract extends AnyContract> = MappingFor<
  TTable,
  TContract
>;

/** Column-like with a name for row lookup. */
interface ColumnLike {
  name: string;
}

/**
 * Maps a DB row to contract shape. Converts null to undefined for optional fields.
 */
export function mapRowToContract<T>(
  row: Record<string, unknown>,
  mapping: Record<string, ColumnLike>,
  contract: AnyContract
): T {
  const result: Record<string, unknown> = {};
  for (const [contractKey, col] of Object.entries(mapping)) {
    const colName = col.name;
    const value = row[colName];
    const fieldDef = contract[contractKey as keyof typeof contract];
    if (fieldDef && !fieldDef._required && value === null) {
      result[contractKey] = undefined;
    } else {
      result[contractKey] = value;
    }
  }
  return result as T;
}
