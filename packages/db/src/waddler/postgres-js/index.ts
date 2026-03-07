/**
 * Waddler adapter for postgres.js.
 * @see https://waddler.drizzle.team/docs/connect-postgres
 *
 * Peer deps: waddler, postgres
 */

import { createRequire } from "node:module";
import type { WaddlerConnectionConfig, WaddlerSql } from "../types.js";

const require = createRequire(import.meta.url);

export interface CreatePostgresJsAdapterConfig {
  connection?: string;
  client?: unknown;
}

/**
 * Creates a postgres.js connection config. Pass to createDb.
 * Pass connection string or existing postgres client.
 */
export function createPostgresJsAdapter(
  config: CreatePostgresJsAdapterConfig
): WaddlerConnectionConfig {
  if (!config.client && config.connection == null) {
    throw new Error("createPostgresJsAdapter: connection or client is required");
  }
  const { waddler } = require("waddler/postgres-js") as {
    waddler: (cfg: string | { connection?: string; client?: unknown }) => WaddlerSql;
  };
  if (config.client) {
    return { sql: waddler({ client: config.client }), dialect: "pg", driver: config.client };
  }
  if (config.connection == null) throw new Error("connection required");
  return { sql: waddler({ connection: config.connection }), dialect: "pg", driver: config.client };
}
