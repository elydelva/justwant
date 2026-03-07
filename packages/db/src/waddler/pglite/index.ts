/**
 * Waddler adapter for PGLite.
 * @see https://waddler.drizzle.team/docs/connect-pglite
 *
 * Peer deps: waddler, @electric-sql/pglite
 */

import { createRequire } from "node:module";
import type { WaddlerConnectionConfig, WaddlerSql } from "../types.js";

const require = createRequire(import.meta.url);

export interface CreatePgliteAdapterConfig {
  connection?: string;
  client?: unknown;
}

/**
 * Creates a PGLite connection config. Pass to createDb.
 * Pass connection config or existing PGlite client.
 */
export function createPgliteAdapter(config: CreatePgliteAdapterConfig): WaddlerConnectionConfig {
  if (!config.client && config.connection == null) {
    throw new Error("createPgliteAdapter: connection or client is required");
  }
  const { waddler } = require("waddler/pglite") as {
    waddler: (cfg: string | { connection?: string; client?: unknown }) => WaddlerSql;
  };
  if (config.client) {
    return { sql: waddler({ client: config.client }), dialect: "pg", driver: config.client };
  }
  if (config.connection == null) throw new Error("connection required");
  return { sql: waddler({ connection: config.connection }), dialect: "pg", driver: config.client };
}
