/**
 * Drizzle adapter types.
 * Supports pg, mysql, sqlite via the same contract.
 */

import type { AnyContract, InferContract } from "@justwant/contract";
import type { MappedTable, MappedTableInternal } from "@justwant/db";
import type { Table } from "drizzle-orm";
import type { MappingFor } from "./mapping.js";

/**
 * Drizzle database client. Supports:
 * - PostgreSQL: drizzle-orm/node-pg
 * - MySQL: drizzle-orm/mysql2
 * - SQLite: drizzle-orm/better-sqlite3
 *
 * Edge runtimes: NeonDatabase, VercelPostgres, TursoDatabase also compatible.
 */
/** Any Drizzle database instance (pg, mysql, sqlite). */
// biome-ignore lint/suspicious/noExplicitAny: DrizzleClient is a union; we need a common interface
export type DrizzleClient = any; // NOSONAR

export interface DrizzleMappedTableInternal<TTable extends Table, TContract extends AnyContract>
  extends MappedTableInternal<TContract> {
  readonly source: TTable;
  readonly mapping: MappingFor<TTable, TContract>;
  readonly client: DrizzleClient;
  readonly tableName: string;
}

export interface DrizzleMappedTable<TTable extends Table, TContract extends AnyContract>
  extends MappedTable<TContract> {
  readonly _internal: DrizzleMappedTableInternal<TTable, TContract>;
}

export interface DrizzleAdapter {
  readonly dialect: "pg" | "mysql" | "sqlite";
  readonly client: DrizzleClient;

  defineTable<TTable extends Table, TContract extends AnyContract>(
    source: TTable,
    contract: TContract,
    mapping: MappingFor<TTable, TContract>,
    options?: DefineMappedTableOptions
  ): DrizzleMappedTable<TTable, TContract>;

  transaction<T>(fn: (tx: DrizzleAdapter) => Promise<T>): Promise<T>;
}

export interface DefineMappedTableOptions {
  /** Column name for soft delete. Default 'deletedAt'. Set to null to disable. */
  softDeleteColumn?: string | null;
}
