/**
 * Waddler adapter for Turso (LibSQL).
 * @see https://waddler.drizzle.team/docs/connect-turso
 *
 * Peer deps: waddler, @libsql/client
 */

import { createRequire } from "node:module";
import type { WaddlerConnectionConfig, WaddlerSql } from "../types.js";

const require = createRequire(import.meta.url);

export interface CreateTursoAdapterConfig {
  connection?: string;
  client?: unknown;
}

/**
 * Creates a Turso (LibSQL) connection config. Pass to createDb.
 * Pass connection config or existing LibSQL client.
 */
export function createTursoAdapter(config: CreateTursoAdapterConfig): WaddlerConnectionConfig {
  if (!config.client && config.connection == null) {
    throw new Error("createTursoAdapter: connection or client is required");
  }
  const { waddler } = require("waddler/libsql") as {
    waddler: (cfg: string | { connection?: string; client?: unknown }) => WaddlerSql;
  };
  if (config.client) {
    return { sql: waddler({ client: config.client }), dialect: "sqlite", driver: config.client };
  }
  if (config.connection == null) throw new Error("connection required");
  return {
    sql: waddler({ connection: config.connection }),
    dialect: "sqlite",
    driver: config.client,
  };
}
