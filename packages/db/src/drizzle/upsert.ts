/**
 * Upsert (ON CONFLICT DO UPDATE).
 * Phase 1: PostgreSQL only.
 */

import { AdapterUnsupportedError } from "@justwant/db/errors";
import type { DrizzleClient } from "./types.js";

/**
 * Upsert a row. PostgreSQL only (ON CONFLICT DO UPDATE).
 * Throws AdapterUnsupportedError for MySQL/SQLite.
 */
export async function upsert<TTable, TData>(
  db: DrizzleClient,
  table: TTable,
  data: TData,
  conflictColumns: string[]
): Promise<unknown> {
  const dialect = (db as unknown as Record<string, unknown>).dialect as
    | { name?: string }
    | undefined;
  if (dialect?.name !== "pg" && dialect?.name !== "postgresql") {
    throw new AdapterUnsupportedError("upsert is only supported on PostgreSQL", {
      operation: "upsert",
      dialect: dialect?.name ?? "unknown",
    });
  }
  const pgDb = db as {
    insert: (t: TTable) => {
      values: (d: TData) => {
        onConflictDoUpdate: (config: unknown) => { returning: () => Promise<unknown[]> };
      };
    };
  };
  return pgDb
    .insert(table)
    .values(data)
    .onConflictDoUpdate({
      target: conflictColumns as never,
      set: data as never,
    } as never)
    .returning();
}
