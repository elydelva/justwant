/**
 * Warehouse adapter types.
 * OLAP: append-only, batch insert, query, aggregate.
 */

import type { InferContract, TableContract, TableFields } from "@justwant/contract";
import type { WaddlerSql } from "@justwant/core/db";

export type { WaddlerSql } from "@justwant/core/db";
export type { WaddlerQuery, StringMapping } from "@justwant/core/db";

export type WarehouseDialect = "clickhouse" | "duckdb";

/** Connection config passed to createWarehouse. Returned by driver factories (createDuckDbAdapter, etc.). */
export interface WarehouseConnectionConfig {
  sql: WaddlerSql;
  dialect: WarehouseDialect;
  driver?: unknown;
  /** Release connection when done. Call warehouse.close() or await on shutdown. */
  close?: () => Promise<void>;
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
