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
  const entries = Object.entries(orderBy)
    .filter(([key]) => mapping[key])
    .map(([key]) => {
      const col = mapping[key];
      const dir = orderBy[key];
      if (!col || dir === undefined) throw new Error("Unreachable");
      return { colName: col.name, dir };
    });
  if (entries.length === 0) return;

  const append = query.append;
  if (!append) return;

  const first = entries[0];
  if (!first) return;
  let orderByClause = sql` ORDER BY ${sql.identifier(first.colName)} ${sql.raw(first.dir === "desc" ? "DESC" : "ASC")}`;
  for (let i = 1; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry) continue;
    const { colName, dir } = entry;
    orderByClause = sql`${orderByClause}, ${sql.identifier(colName)} ${sql.raw(dir === "desc" ? "DESC" : "ASC")}`;
  }
  append.call(query, orderByClause);
}
