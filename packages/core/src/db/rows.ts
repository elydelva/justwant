/**
 * Shared row-handling utilities for Waddler-based adapters.
 */

/** Normalize query result to row array. Handles both array and {rows} shaped results. */
export function toRows(result: unknown): Record<string, unknown>[] {
  if (Array.isArray(result)) return result as Record<string, unknown>[];
  const r = result as { rows?: unknown[] };
  return (r?.rows ?? []) as Record<string, unknown>[];
}

/** Parse exist() query result to boolean. */
export function parseExistResult(rows: Record<string, unknown>[]): boolean {
  const row = rows[0];
  if (!row) return false;
  const val = Object.values(row)[0];
  return val === 1 || val === true || (typeof val === "number" && val !== 0);
}
