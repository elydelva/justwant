/**
 * Warehouse connection for DuckDB.
 * @see https://waddler.drizzle.team/docs/duckdb/connect-duckdb-neo
 *
 * Peer deps: waddler, @duckdb/node-api
 */

import { createRequire } from "node:module";
import type { WaddlerSql, WarehouseConnectionConfig } from "../types.js";

const require = createRequire(import.meta.url);

export interface CreateDuckDbAdapterConfig {
  path?: string;
  client?: unknown;
}

/**
 * Creates a DuckDB connection config. Pass to createWarehouse.
 * Pass path (e.g. ":memory:" or file path) or existing DuckDB client.
 */
export function createDuckDbAdapter(config: CreateDuckDbAdapterConfig): WarehouseConnectionConfig {
  const { waddler } = require("waddler/duckdb-neo") as {
    waddler: (cfg: { url?: string; client?: unknown; [key: string]: unknown }) => WaddlerSql;
  };
  const sql: WaddlerSql = config.client
    ? waddler({ client: config.client })
    : waddler({ url: config.path ?? ":memory:" });
  return { sql, dialect: "duckdb", driver: config.client };
}
