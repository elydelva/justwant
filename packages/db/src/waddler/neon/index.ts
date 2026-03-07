/**
 * Waddler adapter for Neon (neon-http).
 * @see https://waddler.drizzle.team/docs/connect-neon
 *
 * Peer deps: waddler, @neondatabase/serverless
 */

import { createRequire } from "node:module";
import type { WaddlerConnectionConfig, WaddlerSql } from "../types.js";

const require = createRequire(import.meta.url);

export interface CreateNeonAdapterConfig {
  connection?: string;
  client?: unknown;
}

/**
 * Creates a Neon PostgreSQL connection config. Pass to createDb.
 * Pass connection string or existing neon() client.
 */
export function createNeonAdapter(config: CreateNeonAdapterConfig): WaddlerConnectionConfig {
  if (!config.client && config.connection == null) {
    throw new Error("createNeonAdapter: connection or client is required");
  }
  const { waddler } = require("waddler/neon-http") as {
    waddler: (cfg: string | { connection?: string; client?: unknown }) => WaddlerSql;
  };
  if (config.client) {
    return { sql: waddler({ client: config.client }), dialect: "pg", driver: config.client };
  }
  if (config.connection == null) throw new Error("connection required");
  return { sql: waddler(config.connection), dialect: "pg", driver: config.client };
}
