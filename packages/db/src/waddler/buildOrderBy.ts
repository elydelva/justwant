/**
 * Build ORDER BY clause for Waddler SQL.
 */

import type { WaddlerQuery, WaddlerSql } from "./types.js";

export type OrderDirection = "asc" | "desc";

/** Appends ORDER BY clause to the query. Mutates query in place. */
export function appendOrderBy(
  sql: WaddlerSql,
  query: WaddlerQuery,
  mapping: Record<string, { name: string }>,
  orderBy: Record<string, OrderDirection>
): void {
  const entries = Object.entries(orderBy).filter(([key]) => mapping[key]);
  if (entries.length === 0) return;

  const append = query.append;
  if (!append) return;

  append.call(query, sql.raw(" ORDER BY "));
  entries.forEach(([key, dir], i) => {
    const colName = mapping[key]?.name;
    if (!colName) return;
    if (i > 0) append.call(query, sql.raw(", "));
    append.call(query, sql`${sql.identifier(colName)} ${sql.raw(dir === "desc" ? "DESC" : "ASC")}`);
  });
}
