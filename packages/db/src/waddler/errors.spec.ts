import { describe, expect, test } from "bun:test";
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
import { parseWaddlerError } from "./errors.js";

describe("parseWaddlerError", () => {
  test("maps PostgreSQL 23503 to AdapterForeignKeyViolationError", () => {
    const err = parseWaddlerError({ code: "23503", message: "FK violation" });
    expect(err).toBeInstanceOf(AdapterForeignKeyViolationError);
    expect(err.code).toBe("FOREIGN_KEY");
    expect(err.message).toBe("FK violation");
  });

  test("maps PostgreSQL 23505 to AdapterUniqueViolationError", () => {
    const err = parseWaddlerError({ code: "23505", message: "Unique violation" });
    expect(err).toBeInstanceOf(AdapterUniqueViolationError);
    expect(err.code).toBe("UNIQUE");
  });

  test("maps PostgreSQL 23502 to AdapterNotNullViolationError", () => {
    const err = parseWaddlerError({ code: "23502", message: "Not null violation" });
    expect(err).toBeInstanceOf(AdapterNotNullViolationError);
    expect(err.code).toBe("NOT_NULL");
  });

  test("maps PostgreSQL 23514 to AdapterCheckViolationError", () => {
    const err = parseWaddlerError({ code: "23514", message: "Check violation" });
    expect(err).toBeInstanceOf(AdapterCheckViolationError);
    expect(err.code).toBe("CHECK");
  });

  test("maps ECONNREFUSED to AdapterConnectionError", () => {
    const err = parseWaddlerError({ code: "ECONNREFUSED", message: "Connection refused" });
    expect(err).toBeInstanceOf(AdapterConnectionError);
    expect(err.code).toBe("CONNECTION");
  });

  test("maps ECONNRESET to AdapterConnectionError", () => {
    const err = parseWaddlerError({ code: "ECONNRESET", message: "Connection reset" });
    expect(err).toBeInstanceOf(AdapterConnectionError);
  });

  test("maps ETIMEDOUT to AdapterTimeoutError", () => {
    const err = parseWaddlerError({ code: "ETIMEDOUT", message: "Timed out" });
    expect(err).toBeInstanceOf(AdapterTimeoutError);
    expect(err.code).toBe("TIMEOUT");
  });

  test("maps 40P01 to AdapterTransactionError", () => {
    const err = parseWaddlerError({ code: "40P01", message: "Deadlock" });
    expect(err).toBeInstanceOf(AdapterTransactionError);
    expect(err.code).toBe("TRANSACTION");
  });

  test("maps 40001 to AdapterTransactionError", () => {
    const err = parseWaddlerError({ code: "40001", message: "Serialization failure" });
    expect(err).toBeInstanceOf(AdapterTransactionError);
  });

  test("maps SQLite FOREIGN KEY constraint failed message", () => {
    const err = parseWaddlerError(new Error("FOREIGN KEY constraint failed"));
    expect(err).toBeInstanceOf(AdapterForeignKeyViolationError);
  });

  test("maps SQLite UNIQUE constraint failed message", () => {
    const err = parseWaddlerError(new Error("UNIQUE constraint failed"));
    expect(err).toBeInstanceOf(AdapterUniqueViolationError);
  });

  test("maps SQLite NOT NULL constraint failed message", () => {
    const err = parseWaddlerError(new Error("NOT NULL constraint failed: users.email"));
    expect(err).toBeInstanceOf(AdapterNotNullViolationError);
  });

  test("maps SQLite CHECK constraint failed message", () => {
    const err = parseWaddlerError(new Error("CHECK constraint failed: users"));
    expect(err).toBeInstanceOf(AdapterCheckViolationError);
  });

  test("returns AdapterError for unknown errors", () => {
    const err = parseWaddlerError(new Error("Something else"));
    expect(err).toBeInstanceOf(AdapterError);
    expect(err.code).toBe("UNKNOWN");
    expect(err.message).toBe("Something else");
  });

  test("handles non-object input", () => {
    const err = parseWaddlerError("string error");
    expect(err).toBeInstanceOf(AdapterError);
    expect(err.message).toBe("string error");
  });

  test("maps MySQL errno 1062 to AdapterUniqueViolationError", () => {
    const err = parseWaddlerError({
      message: "Duplicate entry",
      errno: 1062,
      table: "users",
      column: "email",
    });
    expect(err).toBeInstanceOf(AdapterUniqueViolationError);
    expect(err.code).toBe("UNIQUE");
  });

  test("maps MySQL ER_DUP_ENTRY to AdapterUniqueViolationError", () => {
    const err = parseWaddlerError({ message: "Duplicate entry", code: "ER_DUP_ENTRY" });
    expect(err).toBeInstanceOf(AdapterUniqueViolationError);
  });

  test("maps cause table/column for MySQL duplicate entry", () => {
    const err = parseWaddlerError({
      message: "Wrapped",
      errno: 1062,
      cause: { table: "orders", column: "ref" },
    });
    expect(err).toBeInstanceOf(AdapterUniqueViolationError);
  });

  test("maps 'duplicate key' message to AdapterUniqueViolationError", () => {
    const err = parseWaddlerError(new Error("duplicate key value violates unique constraint"));
    expect(err).toBeInstanceOf(AdapterUniqueViolationError);
  });

  test("maps 'Duplicate entry' message to AdapterUniqueViolationError", () => {
    const err = parseWaddlerError(new Error("Duplicate entry '42' for key 'PRIMARY'"));
    expect(err).toBeInstanceOf(AdapterUniqueViolationError);
  });

  test("maps 'UNIQUE constraint' message to AdapterUniqueViolationError", () => {
    const err = parseWaddlerError(new Error("UNIQUE constraint failed: users.email"));
    expect(err).toBeInstanceOf(AdapterUniqueViolationError);
  });

  test("falls back to cause message when top-level has no message", () => {
    const err = parseWaddlerError({ cause: { message: "FOREIGN KEY constraint failed" } });
    expect(err).toBeInstanceOf(AdapterForeignKeyViolationError);
  });

  test("returns Unknown error for null-like input", () => {
    const err = parseWaddlerError(null);
    expect(err).toBeInstanceOf(AdapterError);
    expect(err.message).toBe("Unknown error");
  });
});
