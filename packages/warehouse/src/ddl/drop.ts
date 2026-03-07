/**
 * SQL to drop a table.
 */

import type { WarehouseDialect } from "../types.js";

function escapeIdentifier(name: string): string {
  return `"${String(name).replace(/"/g, '""')}"`;
}

export function getDropTableSQL(tableName: string, dialect: WarehouseDialect): string {
  const escaped = escapeIdentifier(tableName);
  return `DROP TABLE IF EXISTS ${escaped}`;
}
