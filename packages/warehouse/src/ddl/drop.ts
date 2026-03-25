/**
 * SQL to drop a table.
 */

import { escapeIdentifier } from "@justwant/core/db";
import type { WarehouseDialect } from "../types.js";

export function getDropTableSQL(tableName: string, dialect: WarehouseDialect): string {
  return `DROP TABLE IF EXISTS ${escapeIdentifier(tableName)}`;
}
