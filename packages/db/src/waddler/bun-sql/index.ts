/**
 * Waddler adapter for Bun SQL (PostgreSQL).
 * @see https://waddler.drizzle.team/docs/connect-bun-sql
 *
 * Peer deps: waddler (Bun runtime)
 */

import { createRequire } from "node:module";
import type { WaddlerConnectionConfig, WaddlerSql } from "../types.js";

const require = createRequire(import.meta.url);

export interface CreateBunSqlAdapterConfig {
  connection?: string;
  client?: unknown;
}

/**
 * Creates a Bun SQL (PostgreSQL) connection config. Pass to createDb.
 * Pass connection string or existing Bun.sql client.
 */
export function createBunSqlAdapter(config: CreateBunSqlAdapterConfig): WaddlerConnectionConfig {
  if (!config.client && config.connection == null) {
    throw new Error("createBunSqlAdapter: connection or client is required");
  }
  const { waddler } = require("waddler/bun-sql") as {
    waddler: (cfg: string | { connection?: string; client?: unknown }) => WaddlerSql;
  };
  if (config.client) {
    return { sql: waddler({ client: config.client }), dialect: "pg", driver: config.client };
  }
  if (config.connection == null) throw new Error("connection required");
  return { sql: waddler({ connection: config.connection }), dialect: "pg", driver: config.client };
}
