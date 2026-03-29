/**
 * Parse Waddler/database errors into normalized adapter errors.
 */

import {
  AdapterError,
  AdapterUniqueViolationError,
} from "@justwant/db/errors";
import { parseByCode, parseSqliteMessage, str } from "../utils.js";

/**
 * Maps raw database errors to normalized AdapterError subclasses.
 * Supports PostgreSQL, MySQL, and SQLite error codes.
 */
export function parseWaddlerError(raw: unknown): AdapterError {
  const err = raw as Record<string, unknown>;
  const cause = err?.cause as Record<string, unknown> | undefined;
  const message = typeof err?.message === "string" ? err.message : "Unknown error";
  const causeMsg = typeof cause?.message === "string" ? cause.message : "";
  const msgToCheck = causeMsg || message;
  const code = (err?.code ?? cause?.code) as string | undefined;
  const errno = (err?.errno ?? cause?.errno) as number | undefined;

  if (errno === 1062 || code === "ER_DUP_ENTRY") {
    return new AdapterUniqueViolationError(message, {
      table: str(err?.table) || str(cause?.table),
      column: str(err?.column) || str(cause?.column),
    });
  }

  if (typeof code === "string") {
    const result = parseByCode(code, message, err);
    if (result) return result;
  }

  const msg = msgToCheck || message;
  const sqliteResult = parseSqliteMessage(msg);
  if (sqliteResult) return sqliteResult;

  if (
    msg.includes("duplicate key") ||
    msg.includes("Duplicate entry") ||
    msg.includes("UNIQUE constraint")
  ) {
    return new AdapterUniqueViolationError(msg);
  }

  return new AdapterError(message, "UNKNOWN", { original: raw });
}
