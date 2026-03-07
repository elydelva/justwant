/**
 * Collect Drizzle schemas from tables.
 * Use drizzle-kit for migration generation.
 */

import type { Table } from "drizzle-orm";

/**
 * Collects table schemas. Returns the tables as-is.
 * For migrations, use drizzle-kit: `drizzle-kit generate`
 */
export function collectSchemas(tables: Record<string, Table>): Record<string, Table> {
  return tables;
}
