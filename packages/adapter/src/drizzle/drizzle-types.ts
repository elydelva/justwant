/**
 * Abstraction over Drizzle ORM internal types.
 * Single point of modification if Drizzle changes.
 *
 * @see docs/LIMITS.md for supported types.
 */

import type { Column } from "drizzle-orm";

/** Extract the data type from a Drizzle column. Uses internal `_` shape. */
export type ColData<C> = C extends { _: { data: infer D } } ? D : unknown;

/** Get column data type - wrapper for type extraction. */
export function getColumnDataType(column: Column): unknown {
  return (column as { _?: { data?: unknown } })._?.data;
}
