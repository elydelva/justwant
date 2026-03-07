/**
 * Waddler adapter for Cloudflare D1.
 * @see https://waddler.drizzle.team/docs/connect-d1
 *
 * Peer deps: waddler (Cloudflare Workers runtime)
 */

import { createRequire } from "node:module";
import type { WaddlerConnectionConfig, WaddlerSql } from "../types.js";

const require = createRequire(import.meta.url);

export interface CreateD1AdapterConfig {
  client: unknown;
}

/**
 * Creates a Cloudflare D1 connection config. Pass to createDb.
 * Pass D1 database binding from env.
 */
export function createD1Adapter(config: CreateD1AdapterConfig): WaddlerConnectionConfig {
  const { waddler } = require("waddler/d1") as {
    waddler: (cfg: { client: unknown }) => WaddlerSql;
  };
  const sql = waddler({ client: config.client });
  return { sql, dialect: "sqlite", driver: config.client };
}
