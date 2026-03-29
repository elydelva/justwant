import { describe, expect, test } from "bun:test";
import {
  WarehouseConnectionError,
  WarehouseError,
  WarehouseTimeoutError,
  parseWarehouseError,
} from "./errors.js";

describe("parseWarehouseError", () => {
  test("returns WarehouseError for unknown errors", () => {
    const err = parseWarehouseError(new Error("Something failed"));
    expect(err).toBeInstanceOf(WarehouseError);
    expect(err.message).toBe("Something failed");
    expect(err.code).toBe("UNKNOWN");
  });

  test("maps ECONNREFUSED to WarehouseConnectionError", () => {
    const err = parseWarehouseError({ message: "Connection refused", code: "ECONNREFUSED" });
    expect(err).toBeInstanceOf(WarehouseConnectionError);
    expect(err.code).toBe("CONNECTION");
  });

  test("maps ETIMEDOUT to WarehouseTimeoutError", () => {
    const err = parseWarehouseError({ message: "Timeout", code: "ETIMEDOUT" });
    expect(err).toBeInstanceOf(WarehouseTimeoutError);
    expect(err.code).toBe("TIMEOUT");
  });

  test("maps ECONNRESET to WarehouseConnectionError", () => {
    const err = parseWarehouseError({ message: "Connection reset", code: "ECONNRESET" });
    expect(err).toBeInstanceOf(WarehouseConnectionError);
    expect(err.code).toBe("CONNECTION");
  });

  test("handles non-Error objects", () => {
    const err = parseWarehouseError("string error");
    expect(err).toBeInstanceOf(WarehouseError);
    expect(err.message).toBe("string error");
  });

  test("extracts message from nested cause", () => {
    const nested = new Error("Connection refused");
    (nested as { code?: string }).code = "ECONNREFUSED";
    const err = parseWarehouseError({ message: "Wrapped", cause: nested });
    expect(err).toBeInstanceOf(WarehouseConnectionError);
    expect(err.code).toBe("CONNECTION");
  });

  test("maps ECONNREFUSED from cause when top-level has no code", () => {
    const err = parseWarehouseError({
      message: "Query failed",
      cause: { message: "connect ECONNREFUSED", code: "ECONNREFUSED" },
    });
    expect(err).toBeInstanceOf(WarehouseConnectionError);
  });

  test('falls back to "Unknown error" for null input', () => {
    const err = parseWarehouseError(null);
    expect(err).toBeInstanceOf(WarehouseError);
    expect(err.message).toBe("Unknown error");
    expect(err.code).toBe("UNKNOWN");
  });
});
