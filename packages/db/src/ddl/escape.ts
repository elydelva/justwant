/**
 * Dialect-aware SQL escaping for @justwant/db DDL generation.
 */

import type { SqlDialect } from "./index.js";

export function escapeIdentifier(name: string, dialect: SqlDialect): string {
  const q = dialect === "mysql" ? "`" : '"';
  return `${q}${String(name).replace(dialect === "mysql" ? /`/g : /"/g, dialect === "mysql" ? "``" : '""')}${q}`;
}
