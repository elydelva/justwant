/**
 * Waddler adapter for node-postgres (pg).
 * @see https://waddler.drizzle.team/docs/connect-postgres
 *
 * Peer deps: waddler, pg
 */

import { createRequire } from "node:module";
import type { WaddlerConnectionConfig, WaddlerSql } from "../types.js";

const require = createRequire(import.meta.url);

export interface CreatePgAdapterConfig {
  connection?: string;
  client?: unknown;
}

/**
 * Creates a PostgreSQL connection config. Pass to createDb.
 * Pass connection string or existing client.
 */
export function createPgAdapter(config: CreatePgAdapterConfig): WaddlerConnectionConfig {
  if (!config.client && config.connection == null) {
    throw new Error("createPgAdapter: connection or client is required");
  }
  const { waddler } = require("waddler/node-postgres") as {
    waddler: (cfg: string | { connection?: string; client?: unknown }) => WaddlerSql;
  };
  if (config.client) {
    return { sql: waddler({ client: config.client }), dialect: "pg", driver: config.client };
  }
  if (config.connection == null) throw new Error("connection required");
  return { sql: waddler({ connection: config.connection }), dialect: "pg", driver: config.client };
}
