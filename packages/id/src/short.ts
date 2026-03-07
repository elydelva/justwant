/**
 * Short URL-safe IDs. Simple API, tool-agnostic.
 */
import { nanoid } from "nanoid";

/**
 * Create a short ID (default 21 chars, URL-safe). Optional length.
 */
export function createId(size?: number): string {
  return size === undefined ? nanoid() : nanoid(size);
}
