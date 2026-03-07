/**
 * Build WHERE clause for warehouse SQL (parameterized).
 */

import type { WaddlerQuery, WaddlerSql } from "./types.js";

export interface AppendWhereOptions {
  firstConnector?: " WHERE " | " AND ";
}

/** Appends WHERE conditions to the query. Mutates query in place. */
export function appendWhere(
  sql: WaddlerSql,
  query: WaddlerQuery,
  mapping: Record<string, { name: string }>,
  where: Record<string, unknown>,
  options?: AppendWhereOptions
): void {
  const entries = Object.entries(where).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;

  const append = query.append;
  if (!append) return;

  const useAnd = options?.firstConnector === " AND ";

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry === undefined) continue;
    const [key, val] = entry;
    const colName = mapping[key]?.name;
    if (!colName) continue;
    const connector = i === 0 && !useAnd ? sql` WHERE ` : sql` AND `;
    append.call(query, connector);
    append.call(query, sql`${sql.identifier(colName)} = ${val}`);
  }
}
