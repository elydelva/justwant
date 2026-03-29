/**
 * Parse database errors into normalized adapter errors.
 */

import { AdapterError } from "@justwant/db/errors";
import { parseByCode, parseSqliteMessage } from "../utils.js";

/**
 * Maps raw database errors to normalized AdapterError subclasses.
 * Supports PostgreSQL, MySQL, and SQLite error codes.
 */
export function parseDbError(raw: unknown): AdapterError {
  const err = raw as Record<string, unknown>;
  const message = typeof err?.message === "string" ? err.message : typeof raw === "string" ? raw : "Unknown error";
  const code = err?.code as string | undefined;

  if (typeof code === "string") {
    const result = parseByCode(code, message, err);
    if (result) return result;
  }

  const msg = message;
  return parseSqliteMessage(msg) ?? new AdapterError(msg, "UNKNOWN", { original: raw });
}
