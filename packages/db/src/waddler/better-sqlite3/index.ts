/**
 * Waddler adapter for better-sqlite3.
 * @see https://waddler.drizzle.team/docs/connect-better-sqlite3
 *
 * Peer deps: waddler, better-sqlite3
 */

import { createRequire } from "node:module";
import type { WaddlerConnectionConfig, WaddlerSql } from "../types.js";

const require = createRequire(import.meta.url);

export interface CreateBetterSqlite3AdapterConfig {
  connection?: string;
  client?: unknown;
}

/**
 * Creates a better-sqlite3 connection config. Pass to createDb.
 * Pass connection string (e.g. ":memory:") or existing Database.
 */
export function createBetterSqlite3Adapter(
  config: CreateBetterSqlite3AdapterConfig
): WaddlerConnectionConfig {
  const { waddler } = require("waddler/better-sqlite3") as {
    waddler: (cfg: string | { connection?: string; client?: unknown }) => WaddlerSql;
  };
  const sql = config.client
    ? waddler({ client: config.client })
    : waddler(config.connection ?? ":memory:");
  return { sql, dialect: "sqlite", driver: config.client };
}
