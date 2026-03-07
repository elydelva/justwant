/**
 * Waddler adapter for Xata (PostgreSQL).
 * @see https://waddler.drizzle.team/docs/connect-xata
 *
 * Peer deps: waddler, @xata.io/client
 */

import { createRequire } from "node:module";
import type { WaddlerConnectionConfig, WaddlerSql } from "../types.js";

const require = createRequire(import.meta.url);

export interface CreateXataAdapterConfig {
  connection?: string;
  client?: unknown;
}

/**
 * Creates an Xata PostgreSQL connection config. Pass to createDb.
 * Pass connection string or existing XataClient.
 */
export function createXataAdapter(config: CreateXataAdapterConfig): WaddlerConnectionConfig {
  if (!config.client && config.connection == null) {
    throw new Error("createXataAdapter: connection or client is required");
  }
  const { waddler } = require("waddler/xata-http") as {
    waddler: (cfg: string | { connection?: string; client?: unknown }) => WaddlerSql;
  };
  if (config.client) {
    return { sql: waddler({ client: config.client }), dialect: "pg", driver: config.client };
  }
  if (config.connection == null) throw new Error("connection required");
  return { sql: waddler({ connection: config.connection }), dialect: "pg", driver: config.client };
}
