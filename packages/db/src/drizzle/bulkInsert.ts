/**
 * Bulk insert multiple rows.
 */

import type { DrizzleClient } from "./types.js";

/**
 * Insert multiple rows in a single query.
 */
export async function bulkInsert<TTable, TData>(
  db: DrizzleClient,
  table: TTable,
  rows: TData[]
): Promise<unknown[]> {
  if (rows.length === 0) return [];
  const result = await (
    db as {
      insert: (t: TTable) => { values: (d: TData[]) => { returning: () => Promise<unknown[]> } };
    }
  )
    .insert(table)
    .values(rows)
    .returning();
  return result;
}
