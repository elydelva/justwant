/**
 * Waddler adapter for Bun SQLite.
 * @see https://waddler.drizzle.team/docs/connect-bun-sqlite
 *
 * Peer deps: waddler (Bun runtime)
 */

import { createRequire } from "node:module";
import type { WaddlerConnectionConfig, WaddlerSql } from "../types.js";

const require = createRequire(import.meta.url);

export interface CreateBunSqliteAdapterConfig {
  connection?: string;
  client?: unknown;
}

/**
 * Creates a Bun SQLite connection config. Pass to createDb.
 * Pass connection string (e.g. ":memory:") or existing Database.
 */
export function createBunSqliteAdapter(
  config: CreateBunSqliteAdapterConfig
): WaddlerConnectionConfig {
  const { waddler } = require("waddler/bun-sqlite") as {
    waddler: (cfg: string | { connection?: string; client?: unknown }) => WaddlerSql;
  };
  const sql = config.client
    ? waddler({ client: config.client })
    : waddler(config.connection ?? ":memory:");
  return { sql, dialect: "sqlite", driver: config.client };
}
