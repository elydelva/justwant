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
  isAdapterError,
} from "@justwant/db/errors";
import { parseDbError } from "./errors.js";

describe("parseDbError", () => {
  test("maps PostgreSQL 23503 to AdapterForeignKeyViolationError", () => {
    const err = parseDbError({ code: "23503", message: "FK violation" });
    expect(err).toBeInstanceOf(AdapterForeignKeyViolationError);
    expect(err.code).toBe("FOREIGN_KEY");
    expect(err.message).toBe("FK violation");
  });

  test("maps PostgreSQL 23505 to AdapterUniqueViolationError", () => {
    const err = parseDbError({ code: "23505", message: "Unique violation" });
    expect(err).toBeInstanceOf(AdapterUniqueViolationError);
    expect(err.code).toBe("UNIQUE");
  });

  test("maps PostgreSQL 23502 to AdapterNotNullViolationError", () => {
    const err = parseDbError({ code: "23502", message: "Not null violation" });
    expect(err).toBeInstanceOf(AdapterNotNullViolationError);
    expect(err.code).toBe("NOT_NULL");
  });

  test("maps PostgreSQL 23514 to AdapterCheckViolationError", () => {
    const err = parseDbError({ code: "23514", message: "Check violation" });
    expect(err).toBeInstanceOf(AdapterCheckViolationError);
    expect(err.code).toBe("CHECK");
  });

  test("maps ECONNREFUSED to AdapterConnectionError", () => {
    const err = parseDbError({ code: "ECONNREFUSED", message: "Connection refused" });
    expect(err).toBeInstanceOf(AdapterConnectionError);
    expect(err.code).toBe("CONNECTION");
  });

  test("maps ETIMEDOUT to AdapterTimeoutError", () => {
    const err = parseDbError({ code: "ETIMEDOUT", message: "Timed out" });
    expect(err).toBeInstanceOf(AdapterTimeoutError);
    expect(err.code).toBe("TIMEOUT");
  });

  test("maps 40P01 to AdapterTransactionError", () => {
    const err = parseDbError({ code: "40P01", message: "Deadlock" });
    expect(err).toBeInstanceOf(AdapterTransactionError);
    expect(err.code).toBe("TRANSACTION");
  });

  test("maps SQLite FOREIGN KEY constraint failed message", () => {
    const err = parseDbError(new Error("FOREIGN KEY constraint failed"));
    expect(err).toBeInstanceOf(AdapterForeignKeyViolationError);
  });

  test("maps SQLite UNIQUE constraint failed message", () => {
    const err = parseDbError(new Error("UNIQUE constraint failed"));
    expect(err).toBeInstanceOf(AdapterUniqueViolationError);
  });

  test("maps SQLite NOT NULL constraint failed message", () => {
    const err = parseDbError(new Error("NOT NULL constraint failed: users.email"));
    expect(err).toBeInstanceOf(AdapterNotNullViolationError);
  });

  test("maps SQLite CHECK constraint failed message", () => {
    const err = parseDbError(new Error("CHECK constraint failed: users"));
    expect(err).toBeInstanceOf(AdapterCheckViolationError);
  });

  test("returns AdapterError for unknown errors", () => {
    const err = parseDbError(new Error("Something else"));
    expect(err).toBeInstanceOf(AdapterError);
    expect(err.code).toBe("UNKNOWN");
    expect(isAdapterError(err)).toBe(true);
  });

  test("handles non-object input", () => {
    const err = parseDbError("string error");
    expect(err).toBeInstanceOf(AdapterError);
    expect(err.message).toBe("string error");
  });
});
