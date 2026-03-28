/**
 * DDL for ClickHouse.
 * MergeTree requires ORDER BY - use first column from mapping.
 */

import type { FieldDef, TableContract } from "@justwant/contract";
import { escapeIdentifier } from "@justwant/core/db";

function columnTypeForClickHouse(field: FieldDef<unknown, boolean>): string {
  const ct = field._columnType ?? "TEXT";
  const map: Record<string, string> = {
    TEXT: "String",
    INTEGER: "Int64",
    REAL: "Float64",
    BOOLEAN: "UInt8",
  };
  return map[ct] ?? "String";
}

/**
 * Generates CREATE TABLE SQL for ClickHouse (MergeTree).
 * ORDER BY is required - uses first column from mapping.
 */
export function getCreateTableSQL(
  contract: TableContract<Record<string, FieldDef<unknown, boolean>>>,
  options?: { ifNotExists?: boolean }
): string {
  const { tableName, fields, mapping } = contract;
  const entries = Object.entries(mapping);
  const parts: string[] = [];

  for (const [key, col] of entries) {
    const field = fields[key as keyof typeof fields];
    if (!field) continue;
    const colName = col.name;
    const baseType = columnTypeForClickHouse(field);
    const type = !field._required ? `Nullable(${baseType})` : baseType;
    parts.push(`${escapeIdentifier(colName)} ${type}`);
  }

  const tableId = escapeIdentifier(tableName);
  const orderByCol = entries[0]?.[1]?.name ?? "id";
  const ifNotExists = options?.ifNotExists ? " IF NOT EXISTS" : "";
  return `CREATE TABLE${ifNotExists} ${tableId} (${parts.join(", ")}) ENGINE = MergeTree() ORDER BY (${escapeIdentifier(orderByCol)})`;
}
