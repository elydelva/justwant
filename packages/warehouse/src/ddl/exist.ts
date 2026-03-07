/**
 * SQL to check if a table exists.
 */

import type { WarehouseDialect } from "../types.js";

function escapeIdentifier(name: string): string {
  return `"${String(name).replace(/"/g, '""')}"`;
}

function escapeStringLiteral(value: string): string {
  return `'${String(value).replace(/'/g, "''")}'`;
}

export function getExistTableSQL(tableName: string, dialect: WarehouseDialect): string {
  if (dialect === "clickhouse") {
    return `EXISTS TABLE ${escapeIdentifier(tableName)}`;
  }
  if (dialect === "duckdb") {
    return `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = ${escapeStringLiteral(tableName)})`;
  }
  throw new Error(`Unsupported warehouse dialect: ${dialect}`);
}
