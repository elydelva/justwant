import { describe, expect, test } from "bun:test";
import {
  AdapterCheckViolationError,
  AdapterConnectionError,
  AdapterForeignKeyViolationError,
  AdapterNotNullViolationError,
  AdapterTimeoutError,
  AdapterTransactionError,
  AdapterUniqueViolationError,
} from "@justwant/db/errors";
import { parseByCode, parseSqliteMessage, str } from "./utils.js";

describe("str", () => {
  test("returns the value when it is a string", () => {
    expect(str("hello")).toBe("hello");
    expect(str("")).toBe("");
  });

  test('returns "" for non-string values', () => {
    expect(str(undefined)).toBe("");
    expect(str(null)).toBe("");
    expect(str(42)).toBe("");
    expect(str({ message: "x" })).toBe("");
  });
});

describe("parseByCode", () => {
  const e = { table: "users", column: "email", constraint: "uq_email" };

  test("23503 → AdapterForeignKeyViolationError", () => {
    const r = parseByCode("23503", "fk", e);
    expect(r).toBeInstanceOf(AdapterForeignKeyViolationError);
  });

  test("23505 → AdapterUniqueViolationError with metadata", () => {
    const r = parseByCode("23505", "unique", e);
    expect(r).toBeInstanceOf(AdapterUniqueViolationError);
  });

  test("23502 → AdapterNotNullViolationError", () => {
    expect(parseByCode("23502", "nn", e)).toBeInstanceOf(AdapterNotNullViolationError);
  });

  test("23514 → AdapterCheckViolationError", () => {
    expect(parseByCode("23514", "chk", e)).toBeInstanceOf(AdapterCheckViolationError);
  });

  test("ECONNREFUSED → AdapterConnectionError", () => {
    expect(parseByCode("ECONNREFUSED", "conn", {})).toBeInstanceOf(AdapterConnectionError);
  });

  test("ECONNRESET → AdapterConnectionError", () => {
    expect(parseByCode("ECONNRESET", "conn", {})).toBeInstanceOf(AdapterConnectionError);
  });

  test("ETIMEDOUT → AdapterTimeoutError", () => {
    expect(parseByCode("ETIMEDOUT", "timeout", {})).toBeInstanceOf(AdapterTimeoutError);
  });

  test("40P01 → AdapterTransactionError", () => {
    expect(parseByCode("40P01", "deadlock", {})).toBeInstanceOf(AdapterTransactionError);
  });

  test("40001 → AdapterTransactionError", () => {
    expect(parseByCode("40001", "serial", {})).toBeInstanceOf(AdapterTransactionError);
  });

  test("unknown code → undefined", () => {
    expect(parseByCode("99999", "?", {})).toBeUndefined();
  });
});

describe("parseSqliteMessage", () => {
  test("FOREIGN KEY constraint failed", () => {
    expect(parseSqliteMessage("FOREIGN KEY constraint failed")).toBeInstanceOf(
      AdapterForeignKeyViolationError
    );
  });

  test("UNIQUE constraint failed", () => {
    expect(parseSqliteMessage("UNIQUE constraint failed: t.col")).toBeInstanceOf(
      AdapterUniqueViolationError
    );
  });

  test("NOT NULL constraint failed", () => {
    expect(parseSqliteMessage("NOT NULL constraint failed: t.col")).toBeInstanceOf(
      AdapterNotNullViolationError
    );
  });

  test("CHECK constraint failed", () => {
    expect(parseSqliteMessage("CHECK constraint failed: t")).toBeInstanceOf(
      AdapterCheckViolationError
    );
  });

  test("unrecognized message → undefined", () => {
    expect(parseSqliteMessage("something else")).toBeUndefined();
  });
});
