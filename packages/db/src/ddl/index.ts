/**
 * DDL generation for TableContract.
 * Extracted from tableContract - adapter-specific SQL generation.
 */

import type { FieldDef } from "@justwant/contract";
import type { TableContract } from "@justwant/contract";

export type SqlDialect = "sqlite" | "pg" | "mysql";

export { getExistTableSQL } from "./exist.js";
export { getDropTableSQL } from "./drop.js";

function escapeIdentifier(name: string, dialect: SqlDialect): string {
  const q = dialect === "mysql" ? "`" : '"';
  return `${q}${String(name).replace(dialect === "mysql" ? /`/g : /"/g, dialect === "mysql" ? "``" : '""')}${q}`;
}

function columnTypeForDialect(field: FieldDef<unknown, boolean>, dialect: SqlDialect): string {
  const ct = field._columnType ?? "TEXT";
  if (dialect === "sqlite") {
    return ct;
  }
  if (dialect === "pg") {
    const map: Record<string, string> = {
      TEXT: "TEXT",
      INTEGER: "INTEGER",
      REAL: "REAL",
    };
    return map[ct] ?? ct;
  }
  if (dialect === "mysql") {
    const map: Record<string, string> = {
      TEXT: "VARCHAR(255)",
      INTEGER: "INTEGER",
      REAL: "DOUBLE",
    };
    return map[ct] ?? ct;
  }
  return ct;
}

/**
 * Generates CREATE TABLE SQL for a TableContract.
 */
export function getCreateTableSQL(
  contract: TableContract<Record<string, FieldDef<unknown, boolean>>>,
  dialect: SqlDialect = "sqlite",
  options?: { schema?: string; ifNotExists?: boolean }
): string {
  const { tableName, fields, mapping } = contract;
  const parts: string[] = [];
  for (const [key, col] of Object.entries(mapping)) {
    const field = fields[key as keyof typeof fields];
    if (!field) continue;
    const colName = col.name;
    const type = columnTypeForDialect(field, dialect);
    const notNull = field._required ? " NOT NULL" : "";
    const primaryKey = field._primaryKey ? " PRIMARY KEY" : "";
    const unique = field._unique ? " UNIQUE" : "";
    const def = field._default ? ` DEFAULT ${field._default}` : "";
    parts.push(
      `${escapeIdentifier(colName, dialect)} ${type}${notNull}${primaryKey}${unique}${def}`
    );
  }
  const tableId =
    dialect === "pg" && options?.schema
      ? `${escapeIdentifier(options.schema, dialect)}.${escapeIdentifier(tableName, dialect)}`
      : escapeIdentifier(tableName, dialect);
  const ifNotExists = options?.ifNotExists ? " IF NOT EXISTS" : "";
  return `CREATE TABLE${ifNotExists} ${tableId} (${parts.join(", ")})`;
}
