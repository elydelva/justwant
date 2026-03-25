/**
 * SQL to drop a table.
 */

import { escapeIdentifier } from "./escape.js";
import type { SqlDialect } from "./index.js";

export function getDropTableSQL(tableName: string, dialect: SqlDialect, schema?: string): string {
  const tableId =
    dialect === "pg" && schema
      ? `${escapeIdentifier(schema, dialect)}.${escapeIdentifier(tableName, dialect)}`
      : escapeIdentifier(tableName, dialect);
  return `DROP TABLE IF EXISTS ${tableId}`;
}
