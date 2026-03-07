/**
 * Warehouse adapter types.
 * OLAP: append-only, batch insert, query, aggregate.
 */

import type { InferContract, TableContract, TableFields } from "@justwant/contract";

export type WarehouseDialect = "clickhouse" | "duckdb";

/** Connection config passed to createWarehouse. Returned by driver factories (createDuckDbAdapter, etc.). */
export interface WarehouseConnectionConfig {
  sql: WaddlerSql;
  dialect: WarehouseDialect;
  driver?: unknown;
  /** Release connection when done. Call warehouse.close() or await on shutdown. */
  close?: () => Promise<void>;
}

/** String-based mapping: contract key → column name. */
export type StringMapping<T extends Record<string, unknown>> = {
  [K in keyof T]: { name: string };
};

/**
 * Waddler SQL client interface.
 * Compatible with waddler/clickhouse, waddler/duckdb-neo.
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

/** Query result - thenable, may have append for building. */
export interface WaddlerQuery {
  then<T>(onfulfilled?: (value: unknown) => T | PromiseLike<T>): Promise<T>;
  catch<T>(onrejected?: (reason: unknown) => T | PromiseLike<T>): Promise<T>;
  append?: (part: unknown) => WaddlerQuery;
}

export interface QueryOptions<T> {
  where?: Partial<InferContract<T>>;
  orderBy?: Record<string, "asc" | "desc">;
  limit?: number;
  offset?: number;
}

export interface AggregateOptions<T extends TableFields, A> {
  groupBy?: (keyof T)[];
  select: Record<string, string>;
  where?: Partial<InferContract<T>>;
}

export interface WarehouseMappedTable<T extends TableFields> {
  readonly contract: TableContract<T>;
  createTable(): Promise<void>;
  exist(): Promise<boolean>;
  drop(): Promise<void>;
  insert(rows: InferContract<TableContract<T>>[]): Promise<void>;
  query(options?: QueryOptions<TableContract<T>>): Promise<InferContract<TableContract<T>>[]>;
  aggregate<A>(options: AggregateOptions<T, A>): Promise<A[]>;
}

export interface Warehouse {
  readonly sql: WaddlerSql;
  readonly dialect: WarehouseDialect;
  readonly driver?: unknown;

  table<T extends TableFields>(contract: TableContract<T>): WarehouseMappedTable<T>;
  createTable(contract: TableContract<TableFields>): Promise<void>;
  /** Release connection. No-op if config had no close. */
  close?(): Promise<void>;
}
