/**
 * Shared Waddler SQL client interfaces used by both @justwant/db and @justwant/warehouse.
 */

import type { AnyContract } from "@justwant/contract";

/** String-based mapping: contract key → column name. */
export type StringMapping<TContract extends Record<string, unknown>> = {
  [K in keyof TContract]: { name: string };
};

/** String-based mapping for AnyContract. */
export type ContractStringMapping<TContract extends AnyContract> = {
  [K in keyof TContract]: { name: string };
};

/**
 * Waddler SQL client interface.
 * Compatible with waddler/node-postgres, waddler/clickhouse, waddler/duckdb-neo, etc.
 */
export interface WaddlerSql {
  (strings: TemplateStringsArray, ...values: unknown[]): WaddlerQuery;
  identifier: (
    name: string | { schema?: string; table: string; column?: string; as?: string }
  ) => unknown;
  raw: (sql: string) => unknown;
  values: (tuples: unknown[][]) => unknown;
  default?: unknown;
  append?: (part: unknown) => WaddlerQuery;
}

/** Query result — thenable, may have append for building. */
export interface WaddlerQuery {
  then<T>(onfulfilled?: (value: unknown) => T | PromiseLike<T>): Promise<T>;
  catch<T>(onrejected?: (reason: unknown) => T | PromiseLike<T>): Promise<T>;
  append?: (part: unknown) => WaddlerQuery;
}
