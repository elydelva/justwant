/**
 * Map DB/warehouse row to contract shape and back.
 */

import type { AnyContract } from "@justwant/contract";

/** Column-like with a name for row lookup. */
export interface ColumnLike {
  name: string;
}

/**
 * Maps a DB row to contract shape.
 * - Converts null to undefined for optional fields.
 * - Converts ISO date strings to Date for date fields (TEXT columns with _columnType).
 */
export function mapRowToContract<T>(
  row: Record<string, unknown>,
  mapping: Record<string, ColumnLike>,
  contract: AnyContract
): T {
  const result: Record<string, unknown> = {};
  for (const [contractKey, col] of Object.entries(mapping)) {
    const colName = col.name;
    let value = row[colName];
    const fieldDef = contract[contractKey as keyof typeof contract];
    if (fieldDef && !fieldDef._required && value === null) {
      result[contractKey] = undefined;
    } else {
      if (value !== null && value !== undefined && typeof value === "string" && fieldDef) {
        const ct = fieldDef._columnType;
        if (ct === "TEXT" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
          const d = new Date(value);
          if (!Number.isNaN(d.getTime())) value = d;
        }
      }
      result[contractKey] = value;
    }
  }
  return result as T;
}

/**
 * Maps contract row to DB column values for insert.
 * Converts Date → ISO string.
 */
export function mapContractToRow(
  row: Record<string, unknown>,
  mapping: Record<string, ColumnLike>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [contractKey, col] of Object.entries(mapping)) {
    if (!(contractKey in row)) continue;
    const value = row[contractKey];
    const colName = col.name;
    if (value instanceof Date) {
      result[colName] = value.toISOString();
    } else {
      result[colName] = value;
    }
  }
  return result;
}
