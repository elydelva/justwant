/**
 * Mapping between Prisma model fields and adapter contract.
 * Contract key → Prisma field name.
 */

import type { AnyContract } from "@justwant/contract";

/** Column-like with a name for row lookup. */
interface ColumnLike {
  name: string;
}

/**
 * Maps a DB row to contract shape. Converts null to undefined for optional fields.
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
    const fieldDef = contract[contractKey];
    if (fieldDef && !fieldDef._required && value === null) {
      result[contractKey] = undefined;
    } else {
      result[contractKey] = value;
    }
  }
  return result as T;
}
