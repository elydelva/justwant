/**
 * Parse database errors into normalized adapter errors.
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
} from "@justwant/adapter/errors";

/**
 * Maps raw database errors to normalized AdapterError subclasses.
 * Supports PostgreSQL, MySQL, and SQLite error codes.
 */
export function parseDbError(raw: unknown): AdapterError {
  const err = raw as Record<string, unknown>;
  const message = typeof err?.message === "string" ? err.message : String(raw ?? "Unknown error");
  const code = err?.code as string | undefined;

  if (typeof code === "string") {
    switch (code) {
      case "23503":
        return new AdapterForeignKeyViolationError(message, {
          table: String(err?.table ?? ""),
          column: String(err?.column ?? ""),
        });
      case "23505":
        return new AdapterUniqueViolationError(message, {
          table: String(err?.table ?? ""),
          column: String(err?.column ?? ""),
          constraint: String(err?.constraint ?? ""),
        });
      case "23502":
        return new AdapterNotNullViolationError(message, {
          table: String(err?.table ?? ""),
          column: String(err?.column ?? ""),
        });
      case "23514":
        return new AdapterCheckViolationError(message, {
          table: String(err?.table ?? ""),
          constraint: String(err?.constraint ?? ""),
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

  const msg = String(message);
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

  return new AdapterError(msg, "UNKNOWN", { original: raw });
}
