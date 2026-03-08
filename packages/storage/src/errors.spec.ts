import { describe, expect, test } from "bun:test";
import { StorageAdapterError, StorageError, parseStorageError } from "./errors.js";

describe("StorageError", () => {
  test("creates error with message and code", () => {
    const err = new StorageError("test", "CODE", { foo: "bar" });
    expect(err.message).toBe("test");
    expect(err.code).toBe("CODE");
    expect(err.metadata).toEqual({ foo: "bar" });
    expect(err.name).toBe("StorageError");
  });
});

describe("StorageAdapterError", () => {
  test("creates adapter error with code ADAPTER", () => {
    const err = new StorageAdapterError("adapter failed");
    expect(err.message).toBe("adapter failed");
    expect(err.code).toBe("ADAPTER");
    expect(err.name).toBe("StorageAdapterError");
  });
});

describe("parseStorageError", () => {
  test("parses error with message", () => {
    const err = parseStorageError(new Error("something went wrong"));
    expect(err).toBeInstanceOf(StorageError);
    expect(err.message).toBe("something went wrong");
    expect(err.code).toBe("UNKNOWN");
  });

  test("parses ECONNREFUSED as StorageAdapterError", () => {
    const err = parseStorageError({ message: "refused", code: "ECONNREFUSED" });
    expect(err).toBeInstanceOf(StorageAdapterError);
    expect(err.code).toBe("ADAPTER");
    expect(err.metadata).toEqual({ code: "ECONNREFUSED" });
  });

  test("parses ECONNRESET as StorageAdapterError", () => {
    const err = parseStorageError({ message: "reset", code: "ECONNRESET" });
    expect(err).toBeInstanceOf(StorageAdapterError);
  });

  test("parses ETIMEDOUT as StorageAdapterError", () => {
    const err = parseStorageError({ message: "timeout", code: "ETIMEDOUT" });
    expect(err).toBeInstanceOf(StorageAdapterError);
  });

  test("handles non-Error input", () => {
    const err = parseStorageError("string error");
    expect(err.message).toBe("string error");
    expect(err.code).toBe("UNKNOWN");
  });
});
