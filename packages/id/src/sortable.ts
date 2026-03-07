/**
 * Time-sortable IDs. Simple API, tool-agnostic.
 */
import { decodeTime, ulid } from "ulid";

/**
 * Create a new time-sortable ID (lexicographically ordered by creation time).
 */
export function createId(): string {
  return ulid();
}

/**
 * Get the creation timestamp (ms) from a time-sortable ID.
 */
export function getTimestamp(id: string): number {
  return decodeTime(id);
}
