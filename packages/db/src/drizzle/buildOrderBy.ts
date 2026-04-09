/**
 * Build ORDER BY clause.
 */

import { asc, desc } from "drizzle-orm";
import type { Column, SQL } from "drizzle-orm";

export type OrderDirection = "asc" | "desc";

/**
 * Builds ORDER BY from a mapping of field names to direction.
 */
export function buildOrderBy(
  mapping: Record<string, Column>,
  orderBy: Record<string, OrderDirection>
): SQL[] {
  return Object.entries(orderBy)
    .filter(([key]) => mapping[key])
    .map(([key, dir]) => {
      const col = mapping[key];
      if (!col) return null;
      return dir === "desc" ? desc(col) : asc(col);
    })
    .filter((c): c is SQL => c !== null);
}
