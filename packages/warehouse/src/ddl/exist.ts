/**
 * SQL to check if a table exists.
 */

import { escapeIdentifier, escapeStringLiteral } from "@justwant/core/db";
import type { WarehouseDialect } from "../types.js";

export function getExistTableSQL(tableName: string, dialect: WarehouseDialect): string {
  if (dialect === "clickhouse") {
    return `EXISTS TABLE ${escapeIdentifier(tableName)}`;
  }
  if (dialect === "duckdb") {
    return `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = ${escapeStringLiteral(tableName)})`;
  }
  throw new Error(`Unsupported warehouse dialect: ${dialect}`);
}
