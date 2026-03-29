/**
 * Parse Waddler/database errors into normalized adapter errors.
 */

import {
  AdapterCheckViolationError,
  AdapterConnectionError,
  AdapterError,
  AdapterForeignKeyViolationError,
  AdapterNotNullViolationError,
  AdapterTimeoutError,
  AdapterTransactionError,
  AdapterUniqueViolationError,
} from "@justwant/db/errors";
import { str } from "../utils.js";

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
    switch (code) {
      case "23503":
        return new AdapterForeignKeyViolationError(message, {
          table: str(err?.table),
          column: str(err?.column),
        });
      case "23505":
        return new AdapterUniqueViolationError(message, {
          table: str(err?.table),
          column: str(err?.column),
          constraint: str(err?.constraint),
        });
      case "23502":
        return new AdapterNotNullViolationError(message, {
          table: str(err?.table),
          column: str(err?.column),
        });
      case "23514":
        return new AdapterCheckViolationError(message, {
          table: str(err?.table),
          constraint: str(err?.constraint),
        });
      case "ECONNREFUSED":
      case "ECONNRESET":
        return new AdapterConnectionError(message, { code });
      case "ETIMEDOUT":
        return new AdapterTimeoutError(message, { code });
      case "40P01":
      case "40001":
        return new AdapterTransactionError(message, { code });
    }
  }

  const msg = String(msgToCheck || message);
  if (msg.includes("FOREIGN KEY constraint failed")) {
    return new AdapterForeignKeyViolationError(msg);
  }
  if (msg.includes("UNIQUE constraint failed")) {
    return new AdapterUniqueViolationError(msg);
  }
  if (msg.includes("NOT NULL constraint failed")) {
    return new AdapterNotNullViolationError(msg);
  }
  if (msg.includes("CHECK constraint failed")) {
    return new AdapterCheckViolationError(msg);
  }
  if (
    msg.includes("duplicate key") ||
    msg.includes("Duplicate entry") ||
    msg.includes("UNIQUE constraint")
  ) {
    return new AdapterUniqueViolationError(msg);
  }

  return new AdapterError(message, "UNKNOWN", { original: raw });
}
