/**
 * Waddler adapter for Cloudflare Durable Objects (SQLite).
 * @see https://waddler.drizzle.team/docs/connect-durable-objects
 *
 * Peer deps: waddler (Cloudflare Workers runtime)
 */

import { createRequire } from "node:module";
import type { WaddlerConnectionConfig, WaddlerSql } from "../types.js";

const require = createRequire(import.meta.url);

export interface CreateDurableObjectsAdapterConfig {
  client: unknown;
}

/**
 * Creates a Cloudflare Durable Objects SQLite connection config. Pass to createDb.
 * Pass Durable Object state.
 */
export function createDurableObjectsAdapter(
  config: CreateDurableObjectsAdapterConfig
): WaddlerConnectionConfig {
  const { waddler } = require("waddler/durable-sqlite") as {
    waddler: (cfg: { client: unknown }) => WaddlerSql;
  };
  const sql = waddler({ client: config.client });
  return { sql, dialect: "sqlite", driver: config.client };
}
