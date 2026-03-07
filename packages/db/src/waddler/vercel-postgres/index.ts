/**
 * Waddler adapter for Vercel Postgres.
 * @see https://waddler.drizzle.team/docs/connect-vercel-postgres
 *
 * Peer deps: waddler, @vercel/postgres
 */

import { createRequire } from "node:module";
import type { WaddlerConnectionConfig, WaddlerSql } from "../types.js";

const require = createRequire(import.meta.url);

export interface CreateVercelPostgresAdapterConfig {
  connection?: string;
  client?: unknown;
}

/**
 * Creates a Vercel Postgres connection config. Pass to createDb.
 * Pass connection string or existing Pool client.
 */
export function createVercelPostgresAdapter(
  config: CreateVercelPostgresAdapterConfig
): WaddlerConnectionConfig {
  if (!config.client && config.connection == null) {
    throw new Error("createVercelPostgresAdapter: connection or client is required");
  }
  const { waddler } = require("waddler/vercel-postgres") as {
    waddler: (cfg: string | { connection?: string; client?: unknown }) => WaddlerSql;
  };
  if (config.client) {
    return { sql: waddler({ client: config.client }), dialect: "pg", driver: config.client };
  }
  if (config.connection == null) throw new Error("connection required");
  return { sql: waddler({ connection: config.connection }), dialect: "pg", driver: config.client };
}
