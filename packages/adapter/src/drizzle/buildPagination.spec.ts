import { describe, expect, test } from "bun:test";
import { buildPagination } from "./buildPagination.js";

describe("buildPagination", () => {
  test("returns empty object for undefined options", () => {
    const result = buildPagination();
    expect(result).toEqual({});
  });

  test("returns empty object for empty options", () => {
    const result = buildPagination({});
    expect(result).toEqual({});
  });

  test("returns limit and offset when provided", () => {
    const result = buildPagination({ limit: 10, offset: 20 });
    expect(result).toEqual({ limit: 10, offset: 20 });
  });

  test("returns only limit when offset omitted", () => {
    const result = buildPagination({ limit: 5 });
    expect(result).toEqual({ limit: 5, offset: undefined });
  });

  test("returns only offset when limit omitted", () => {
    const result = buildPagination({ offset: 10 });
    expect(result).toEqual({ limit: undefined, offset: 10 });
  });
});
