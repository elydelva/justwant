/**
 * Waddler adapter for MySQL (mysql2).
 * @see https://waddler.drizzle.team/docs/connect-mysql
 *
 * Peer deps: waddler, mysql2
 */

import { createRequire } from "node:module";
import type { WaddlerConnectionConfig, WaddlerSql } from "../types.js";

const require = createRequire(import.meta.url);

export interface CreateMysqlAdapterConfig {
  connection?: string;
  client?: unknown;
}

/**
 * Creates a MySQL connection config. Pass to createDb.
 * Pass connection string or existing Pool/Connection.
 */
export function createMysqlAdapter(config: CreateMysqlAdapterConfig): WaddlerConnectionConfig {
  if (!config.client && config.connection == null) {
    throw new Error("createMysqlAdapter: connection or client is required");
  }
  const { waddler } = require("waddler/mysql2") as {
    waddler: (cfg: string | { connection?: string; client?: unknown }) => WaddlerSql;
  };
  if (config.client) {
    return { sql: waddler({ client: config.client }), dialect: "mysql", driver: config.client };
  }
  if (config.connection == null) throw new Error("connection required");
  return {
    sql: waddler({ connection: config.connection }),
    dialect: "mysql",
    driver: config.client,
  };
}
