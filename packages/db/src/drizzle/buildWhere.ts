/**
 * Build WHERE clause from Partial<InferContract>.
 */

import { and, eq } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { Column } from "drizzle-orm";

/**
 * Builds a WHERE condition from a partial object.
 * Each key-value pair becomes eq(column, value).
 */
export function buildWhere(
  mapping: Record<string, Column>,
  where: Record<string, unknown>
): SQL | undefined {
  const conditions = Object.entries(where)
    .filter(([, v]) => v !== undefined)
    .map(([key, value]) => {
      const col = mapping[key];
      if (!col) return undefined;
      return eq(col, value as never);
    })
    .filter((c): c is SQL => c !== undefined);
  return and(...conditions);
}
