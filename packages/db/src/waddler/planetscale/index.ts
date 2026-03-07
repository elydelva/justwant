/**
 * Waddler adapter for PlanetScale (MySQL).
 * @see https://waddler.drizzle.team/docs/connect-planetscale
 *
 * Peer deps: waddler, @planetscale/database
 */

import { createRequire } from "node:module";
import type { WaddlerConnectionConfig, WaddlerSql } from "../types.js";

const require = createRequire(import.meta.url);

export interface CreatePlanetscaleAdapterConfig {
  connection?: string;
  client?: unknown;
}

/**
 * Creates a PlanetScale (MySQL) connection config. Pass to createDb.
 * Pass connection string or existing Client.
 */
export function createPlanetscaleAdapter(
  config: CreatePlanetscaleAdapterConfig
): WaddlerConnectionConfig {
  if (!config.client && config.connection == null) {
    throw new Error("createPlanetscaleAdapter: connection or client is required");
  }
  const { waddler } = require("waddler/planetscale-serverless") as {
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
