import { describe, expect, test } from "bun:test";
import {
  AdapterCheckViolationError,
  AdapterConnectionError,
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
} from "@justwant/db/errors";
import { parsePrismaError } from "./errors.js";

describe("parsePrismaError", () => {
  test("maps P2002 to AdapterUniqueViolationError", () => {
    const err = parsePrismaError({ code: "P2002", message: "Unique constraint failed" });
    expect(err).toBeInstanceOf(AdapterUniqueViolationError);
    expect(err.code).toBe("UNIQUE");
  });

  test("maps P2002 with meta.target to AdapterUniqueViolationError", () => {
    const err = parsePrismaError({
      code: "P2002",
      message: "Unique constraint failed",
      meta: { target: ["email"] },
    });
    expect(err).toBeInstanceOf(AdapterUniqueViolationError);
    expect(err.metadata?.column).toBe("email");
  });

  test("maps P2003 to AdapterForeignKeyViolationError", () => {
    const err = parsePrismaError({
      code: "P2003",
      message: "Foreign key constraint failed",
      meta: { field_name: "userId" },
    });
    expect(err).toBeInstanceOf(AdapterForeignKeyViolationError);
    expect(err.code).toBe("FOREIGN_KEY");
    expect(err.metadata?.column).toBe("userId");
  });

  test("maps P2011 to AdapterNotNullViolationError", () => {
    const err = parsePrismaError({ code: "P2011", message: "Null constraint violation" });
    expect(err).toBeInstanceOf(AdapterNotNullViolationError);
    expect(err.code).toBe("NOT_NULL");
  });

  test("maps P2014 to AdapterForeignKeyViolationError", () => {
    const err = parsePrismaError({
      code: "P2014",
      message: "Required relation violation",
      meta: { relation_name: "UserPosts" },
    });
    expect(err).toBeInstanceOf(AdapterForeignKeyViolationError);
  });

  test("maps P2025 to AdapterNotFoundError", () => {
    const err = parsePrismaError({
      code: "P2025",
      message: "Record not found",
      meta: { modelName: "User" },
    });
    expect(err).toBeInstanceOf(AdapterNotFoundError);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.metadata?.table).toBe("User");
  });

  test("maps P1000 to AdapterConnectionError", () => {
    const err = parsePrismaError({ code: "P1000", message: "Authentication failed" });
    expect(err).toBeInstanceOf(AdapterConnectionError);
    expect(err.code).toBe("CONNECTION");
  });

  test("returns AdapterError for unknown errors", () => {
    const err = parsePrismaError(new Error("Something else"));
    expect(err).toBeInstanceOf(AdapterError);
    expect(err.code).toBe("UNKNOWN");
    expect(isAdapterError(err)).toBe(true);
  });

  test("handles non-object input", () => {
    const err = parsePrismaError("string error");
    expect(err).toBeInstanceOf(AdapterError);
    expect(err.message).toBe("string error");
  });

  test("maps P2000 to AdapterMappingError", () => {
    const err = parsePrismaError({
      code: "P2000",
      message: "Value too long",
      meta: { column_name: "email" },
    });
    expect(err).toBeInstanceOf(AdapterMappingError);
    expect(err.code).toBe("MAPPING_ERROR");
  });

  test("maps P2021 to AdapterMappingError", () => {
    const err = parsePrismaError({
      code: "P2021",
      message: "The table `main.User` does not exist in the current database.",
      meta: { table: "main.User" },
    });
    expect(err).toBeInstanceOf(AdapterMappingError);
    expect(err.code).toBe("MAPPING_ERROR");
    expect(err.metadata?.column).toBe("main.User");
  });

  test("maps P2024 to AdapterTimeoutError", () => {
    const err = parsePrismaError({ code: "P2024", message: "Connection pool timeout" });
    expect(err).toBeInstanceOf(AdapterTimeoutError);
    expect(err.code).toBe("TIMEOUT");
  });

  test("maps P2034 to AdapterTransactionError", () => {
    const err = parsePrismaError({
      code: "P2034",
      message: "Transaction failed due to deadlock",
    });
    expect(err).toBeInstanceOf(AdapterTransactionError);
  });

  test("maps PrismaClientValidationError to AdapterMappingError", () => {
    const err = parsePrismaError({
      name: "PrismaClientValidationError",
      message: "Invalid field type",
    });
    expect(err).toBeInstanceOf(AdapterMappingError);
  });

  test("maps PrismaClientInitializationError to AdapterConnectionError", () => {
    const err = parsePrismaError({
      name: "PrismaClientInitializationError",
      message: "Could not connect to database",
    });
    expect(err).toBeInstanceOf(AdapterConnectionError);
  });

  test("maps PrismaClientRustPanicError to AdapterError with ENGINE_PANIC", () => {
    const err = parsePrismaError({
      name: "PrismaClientRustPanicError",
      message: "Engine panic",
    });
    expect(err).toBeInstanceOf(AdapterError);
    expect(err.code).toBe("ENGINE_PANIC");
  });

  test("maps P2001 to AdapterNotFoundError", () => {
    const err = parsePrismaError({
      code: "P2001",
      message: "Record not found",
      meta: { model_name: "User" },
    });
    expect(err).toBeInstanceOf(AdapterNotFoundError);
    expect(err.metadata?.table).toBe("User");
  });

  test("maps P2004/P2035 to AdapterCheckViolationError", () => {
    const err = parsePrismaError({
      code: "P2004",
      message: "Check constraint failed",
      meta: { database_error: "positive_check" },
    });
    expect(err).toBeInstanceOf(AdapterCheckViolationError);
    expect(err.metadata?.constraint).toBe("positive_check");
  });

  test("maps P2012/P2013/P2019/P2020/P2022/P2023/P2033 to AdapterMappingError", () => {
    const err = parsePrismaError({
      code: "P2012",
      message: "Invalid value",
      meta: { field_name: "email" },
    });
    expect(err).toBeInstanceOf(AdapterMappingError);
    expect(err.metadata?.column).toBe("email");
  });

  test("maps P2015/P2018 to AdapterNotFoundError", () => {
    const err = parsePrismaError({
      code: "P2015",
      message: "Related record not found",
      meta: { modelName: "Post" },
    });
    expect(err).toBeInstanceOf(AdapterNotFoundError);
    expect(err.metadata?.table).toBe("Post");
  });

  test("maps P2017 to AdapterForeignKeyViolationError", () => {
    const err = parsePrismaError({
      code: "P2017",
      message: "Relation violation",
      meta: { relation_name: "UserProfile" },
    });
    expect(err).toBeInstanceOf(AdapterForeignKeyViolationError);
    expect(err.metadata?.column).toBe("UserProfile");
  });

  test("maps P2026 to AdapterUnsupportedError", () => {
    const err = parsePrismaError({
      code: "P2026",
      message: "Unsupported feature",
      meta: { feature: "rawQueries" },
    });
    expect(err).toBeInstanceOf(AdapterUnsupportedError);
    expect(err.metadata?.operation).toBe("rawQueries");
  });

  test("maps P2028 to AdapterTransactionError", () => {
    const err = parsePrismaError({
      code: "P2028",
      message: "Transaction conflict",
    });
    expect(err).toBeInstanceOf(AdapterTransactionError);
  });

  test("maps P2030 to AdapterUnsupportedError with fulltext", () => {
    const err = parsePrismaError({
      code: "P2030",
      message: "Fulltext not supported",
    });
    expect(err).toBeInstanceOf(AdapterUnsupportedError);
    expect(err.metadata?.operation).toBe("fulltext");
  });
});
