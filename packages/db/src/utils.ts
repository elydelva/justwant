import type { AdapterError } from "@justwant/db/errors";
import {
  AdapterCheckViolationError,
  AdapterConnectionError,
  AdapterForeignKeyViolationError,
  AdapterNotNullViolationError,
  AdapterTimeoutError,
  AdapterTransactionError,
  AdapterUniqueViolationError,
} from "@justwant/db/errors";

export function str(val: unknown): string {
  return typeof val === "string" ? val : "";
}

/**
 * Parse a known error code + raw error fields into an AdapterError.
 * Returns undefined if the code is not recognized.
 */
export function parseByCode(
  code: string,
  message: string,
  err: Record<string, unknown>
): AdapterError | undefined {
  switch (code) {
    case "23503":
      return new AdapterForeignKeyViolationError(message, {
        table: str(err.table),
        column: str(err.column),
      });
    case "23505":
      return new AdapterUniqueViolationError(message, {
        table: str(err.table),
        column: str(err.column),
        constraint: str(err.constraint),
      });
    case "23502":
      return new AdapterNotNullViolationError(message, {
        table: str(err.table),
        column: str(err.column),
      });
    case "23514":
      return new AdapterCheckViolationError(message, {
        table: str(err.table),
        constraint: str(err.constraint),
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
  return undefined;
}

/**
 * Parse a SQLite constraint error message into an AdapterError.
 * Returns undefined if the message is not recognized.
 */
export function parseSqliteMessage(msg: string): AdapterError | undefined {
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
  return undefined;
}
