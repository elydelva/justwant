/**
 * Map DB/warehouse row to contract shape and back.
 */

import type { AnyContract } from "@justwant/contract";

/** Column-like with a name for row lookup. */
export interface ColumnLike {
  name: string;
}

function resolveFieldValue(
  value: unknown,
  fieldDef: { _required?: boolean; _kind?: string } | undefined
): unknown {
  if (fieldDef && !fieldDef._required && value === null) return undefined;
  if (
    value !== null &&
    value !== undefined &&
    typeof value === "string" &&
    fieldDef?._kind === "date"
  ) {
    const d = new Date(value);
    if (/^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(d.getTime())) return d;
  }
  return value;
}

/**
 * Maps a DB row to contract shape.
 * - Converts null to undefined for optional fields.
 * - Converts ISO date strings to Date only for fields with _kind === "date".
 */
export function mapRowToContract<T>(
  row: Record<string, unknown>,
  mapping: Record<string, ColumnLike>,
  contract: AnyContract
): T {
  const result: Record<string, unknown> = {};
  for (const [contractKey, col] of Object.entries(mapping)) {
    const colName = col.name;
    const value = row[colName];
    const fieldDef = contract[contractKey as keyof typeof contract];
    result[contractKey] = resolveFieldValue(value, fieldDef);
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
