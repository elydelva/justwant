/**
 * Waddler adapter for TiDB (MySQL-compatible).
 * @see https://waddler.drizzle.team/docs/connect-tidb
 *
 * Peer deps: waddler, @tidbcloud/serverless
 */

import { createRequire } from "node:module";
import type { WaddlerConnectionConfig, WaddlerSql } from "../types.js";

const require = createRequire(import.meta.url);

export interface CreateTidbAdapterConfig {
  connection?: string;
  client?: unknown;
}

/**
 * Creates a TiDB (MySQL-compatible) connection config. Pass to createDb.
 * Pass connection string or existing driver.
 */
export function createTidbAdapter(config: CreateTidbAdapterConfig): WaddlerConnectionConfig {
  if (!config.client && config.connection == null) {
    throw new Error("createTidbAdapter: connection or client is required");
  }
  const { waddler } = require("waddler/tidb-serverless") as {
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
