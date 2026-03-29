/**
 * Waddler adapter types.
 * Schema-less: table and column names are strings.
 */

import type { AnyContract, TableContract } from "@justwant/contract";
import type { WaddlerSql } from "@justwant/core/db";
import type { MappedTable, MappedTableInternal } from "@justwant/db";

export type { WaddlerSql } from "@justwant/core/db";
export type { WaddlerQuery } from "@justwant/core/db";

/** String-based mapping: contract key → column name. */
export type StringMapping<TContract extends AnyContract> = {
  [K in keyof TContract]: { name: string };
};

/** Table source: table name or schema.table. */
export type TableSource = string | { schema?: string; table: string };

export interface WaddlerMappedTableInternal<TContract extends AnyContract>
  extends MappedTableInternal<TContract> {
  readonly tableName: string;
  readonly mapping: StringMapping<TContract>;
  readonly client: WaddlerSql;
}

export interface WaddlerMappedTable<TContract extends AnyContract> extends MappedTable<TContract> {
  readonly _internal: WaddlerMappedTableInternal<TContract>;
}

export type WaddlerDialect = "pg" | "mysql" | "sqlite";

/** Connection config passed to createDb. Returned by driver factories (createBunSqliteAdapter, etc.). */
export interface WaddlerConnectionConfig {
  sql: WaddlerSql;
  dialect: WaddlerDialect;
  driver?: unknown;
  onValidationError?: "throw" | "return";
  /** Release connection when done. Call db.close() or await on shutdown. */
  close?: () => Promise<void>;
}

export interface CreateWaddlerAdapterOptions {
  dialect: WaddlerDialect;
  /** Expose the native driver (pg Pool, neon client, etc.). */
  driver?: unknown;
  /** On validation error: "throw" (default) or "return" for createSafe/updateSafe. */
  onValidationError?: "throw" | "return";
}

export interface TableOptions {
  /** Override mapping for specific keys. Merged with contract.mapping. */
  mapping?: Partial<Record<string, { name: string }>>;
  /** Column name for soft delete. Default 'deletedAt'. Set to null to disable. */
  softDeleteColumn?: string | null;
}

export interface Db {
  readonly sql: WaddlerSql;
  readonly driver?: unknown;
  readonly dialect: WaddlerDialect;

  /** Execute getCreateTableSQL and run DDL. */
  createTable<T extends TableContract<AnyContract>>(contract: T): Promise<void>;

  /** Create table from TableContract (tableName + mapping from contract). */
  table<T extends TableContract<AnyContract>>(
    contract: T,
    options?: TableOptions
  ): WaddlerMappedTable<T["fields"]>;

  /** Legacy: define table with explicit tableSource, contract, mapping. */
  defineTable<TContract extends AnyContract>(
    tableName: TableSource,
    contract: TContract,
    mapping: StringMapping<TContract>,
    options?: DefineWaddlerTableOptions
  ): WaddlerMappedTable<TContract>;

  transaction?<T>(fn: (tx: Db) => Promise<T>): Promise<T>;
  /** Release connection. No-op if config had no close. */
  close?(): Promise<void>;
}

export interface DefineWaddlerTableOptions {
  /** Column name for soft delete. Default 'deletedAt'. Set to null to disable. */
  softDeleteColumn?: string | null;
}
