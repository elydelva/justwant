/**
 * DDL for DuckDB.
 */

import type { FieldDef, TableContract } from "@justwant/contract";
import { escapeIdentifier } from "@justwant/core/db";

function columnTypeForDuckDb(field: FieldDef<unknown, boolean>): string {
  const ct = field._columnType ?? "TEXT";
  const map: Record<string, string> = {
    TEXT: "VARCHAR",
    INTEGER: "BIGINT",
    REAL: "DOUBLE",
    BOOLEAN: "BOOLEAN",
    DATE: "DATE",
    JSON: "JSON",
  };
  return map[ct] ?? "VARCHAR";
}

/**
 * Generates CREATE TABLE SQL for DuckDB.
 */
export function getCreateTableSQL(
  contract: TableContract<Record<string, FieldDef<unknown, boolean>>>,
  options?: { ifNotExists?: boolean }
): string {
  const { tableName, fields, mapping } = contract;
  const parts: string[] = [];

  for (const [key, col] of Object.entries(mapping)) {
    const field = fields[key];
    if (!field) continue;
    const colName = col.name;
    const type = columnTypeForDuckDb(field);
    parts.push(`${escapeIdentifier(colName)} ${type}`);
  }

  const tableId = escapeIdentifier(tableName);
  const ifNotExists = options?.ifNotExists ? " IF NOT EXISTS" : "";
  return `CREATE TABLE${ifNotExists} ${tableId} (${parts.join(", ")})`;
}
