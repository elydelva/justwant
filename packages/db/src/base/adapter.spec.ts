import { describe, expect, test } from "bun:test";
import {
  AdapterCheckViolationError,
  AdapterConnectionError,
  AdapterConstraintError,
  AdapterError,
  AdapterForeignKeyViolationError,
  AdapterMappingError,
  AdapterNotFoundError,
  AdapterNotNullViolationError,
  AdapterTimeoutError,
  AdapterTransactionError,
  AdapterUniqueViolationError,
  AdapterUnsupportedError,
  isAdapterError,
} from "./errors.js";

describe("AdapterError", () => {
  test("extends Error and has message", () => {
    const err = new AdapterError("Not found", "NOT_FOUND");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AdapterError);
    expect(err.message).toBe("Not found");
    expect(err.name).toBe("AdapterError");
    expect(err.code).toBe("NOT_FOUND");
  });

  test("accepts optional metadata", () => {
    const err = new AdapterError("Constraint violation", "CONSTRAINT_VIOLATION", {
      table: "users",
    });
    expect(err.code).toBe("CONSTRAINT_VIOLATION");
    expect(err.metadata).toEqual({ table: "users" });
  });

  test("can be thrown and caught", () => {
    expect(() => {
      throw new AdapterError("Test", "TEST");
    }).toThrow(AdapterError);
    expect(() => {
      throw new AdapterError("Test", "TEST");
    }).toThrow("Test");
  });
});

describe("AdapterNotFoundError", () => {
  test("extends AdapterError with NOT_FOUND code", () => {
    const err = new AdapterNotFoundError("User not found", { table: "users", id: "1" });
    expect(err).toBeInstanceOf(AdapterError);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.metadata).toEqual({ table: "users", id: "1" });
  });
});

describe("AdapterUniqueViolationError", () => {
  test("extends AdapterConstraintError with UNIQUE constraintType", () => {
    const err = new AdapterUniqueViolationError("Duplicate email", {
      table: "users",
      column: "email",
    });
    expect(err).toBeInstanceOf(AdapterError);
    expect(err.constraintType).toBe("UNIQUE");
    expect(err.metadata).toEqual({ table: "users", column: "email" });
  });
});

describe("AdapterConstraintError", () => {
  test("extends AdapterError with constraintType", () => {
    const err = new AdapterUniqueViolationError("Duplicate", { column: "email" });
    expect(err).toBeInstanceOf(AdapterConstraintError);
    expect(err.constraintType).toBe("UNIQUE");
  });
});

describe("AdapterForeignKeyViolationError", () => {
  test("extends AdapterConstraintError with FOREIGN_KEY", () => {
    const err = new AdapterForeignKeyViolationError("FK failed", {
      column: "userId",
      referencedTable: "users",
    });
    expect(err).toBeInstanceOf(AdapterConstraintError);
    expect(err.constraintType).toBe("FOREIGN_KEY");
    expect(err.metadata?.column).toBe("userId");
  });
});

describe("AdapterNotNullViolationError", () => {
  test("extends AdapterConstraintError with NOT_NULL", () => {
    const err = new AdapterNotNullViolationError("Null not allowed", { column: "email" });
    expect(err.constraintType).toBe("NOT_NULL");
  });
});

describe("AdapterCheckViolationError", () => {
  test("extends AdapterConstraintError with CHECK", () => {
    const err = new AdapterCheckViolationError("Check failed", { constraint: "positive" });
    expect(err.constraintType).toBe("CHECK");
  });
});

describe("AdapterMappingError", () => {
  test("extends AdapterError with MAPPING_ERROR code", () => {
    const err = new AdapterMappingError("Invalid field", { field: "email" });
    expect(err.code).toBe("MAPPING_ERROR");
    expect(err.metadata?.field).toBe("email");
  });
});

describe("AdapterUnsupportedError", () => {
  test("extends AdapterError with UNSUPPORTED code", () => {
    const err = new AdapterUnsupportedError("upsert not supported", {
      operation: "upsert",
      dialect: "sqlite",
    });
    expect(err.code).toBe("UNSUPPORTED");
    expect(err.metadata?.operation).toBe("upsert");
  });
});

describe("AdapterConnectionError", () => {
  test("extends AdapterError with CONNECTION code", () => {
    const err = new AdapterConnectionError("Connection refused");
    expect(err.code).toBe("CONNECTION");
  });
});

describe("AdapterTransactionError", () => {
  test("extends AdapterError with TRANSACTION code", () => {
    const err = new AdapterTransactionError("Deadlock");
    expect(err.code).toBe("TRANSACTION");
  });
});

describe("AdapterTimeoutError", () => {
  test("extends AdapterError with TIMEOUT code", () => {
    const err = new AdapterTimeoutError("Query timeout");
    expect(err.code).toBe("TIMEOUT");
  });
});

describe("isAdapterError", () => {
  test("returns true for AdapterError instances", () => {
    expect(isAdapterError(new AdapterError("x", "X"))).toBe(true);
    expect(isAdapterError(new AdapterNotFoundError("x"))).toBe(true);
  });

  test("returns false for non-AdapterError", () => {
    expect(isAdapterError(new Error("x"))).toBe(false);
    expect(isAdapterError("string")).toBe(false);
    expect(isAdapterError(null)).toBe(false);
  });
});
