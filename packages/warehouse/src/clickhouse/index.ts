/**
 * Warehouse connection for ClickHouse.
 * @see https://waddler.drizzle.team/docs/clickhouse/get-started/clickhouse-new
 *
 * Peer deps: waddler, @clickhouse/client
 */

import { createRequire } from "node:module";
import type { WaddlerSql, WarehouseConnectionConfig } from "../types.js";

const require = createRequire(import.meta.url);

export interface CreateClickHouseAdapterConfig {
  connection?: string;
  client?: unknown;
}

/**
 * Creates a ClickHouse connection config. Pass to createWarehouse.
 * Pass connection string (e.g. http://localhost:8123) or existing ClickHouse client.
 */
export function createClickHouseAdapter(
  config: CreateClickHouseAdapterConfig
): WarehouseConnectionConfig {
  const { waddler } = require("waddler/clickhouse") as {
    waddler: (cfg: string | { connection?: { url?: string }; client?: unknown }) => WaddlerSql;
  };
  const sql: WaddlerSql = config.client
    ? waddler({ client: config.client })
    : waddler(config.connection ?? "http://localhost:8123");
  return { sql, dialect: "clickhouse", driver: config.client };
}
