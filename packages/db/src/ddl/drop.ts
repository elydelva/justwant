/**
 * SQL to drop a table.
 */

import type { SqlDialect } from "./index.js";

function escapeIdentifier(name: string, dialect: SqlDialect): string {
  const q = dialect === "mysql" ? "`" : '"';
  return `${q}${String(name).replace(dialect === "mysql" ? /`/g : /"/g, dialect === "mysql" ? "``" : '""')}${q}`;
}

export function getDropTableSQL(tableName: string, dialect: SqlDialect, schema?: string): string {
  const tableId =
    dialect === "pg" && schema
      ? `${escapeIdentifier(schema, dialect)}.${escapeIdentifier(tableName, dialect)}`
      : escapeIdentifier(tableName, dialect);
  return `DROP TABLE IF EXISTS ${tableId}`;
}
