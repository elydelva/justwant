import { describe, expect, test } from "bun:test";
import { createId, getTimestamp } from "./sortable.js";

describe("createId", () => {
  test("returns a 26-character string", () => {
    const id = createId();
    expect(typeof id).toBe("string");
    expect(id).toHaveLength(26);
  });

  test("returns URL-safe characters (Crockford base32)", () => {
    const id = createId();
    expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  test("generates unique IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(createId());
    }
    expect(ids.size).toBe(100);
  });
});

describe("getTimestamp", () => {
  test("returns creation timestamp in milliseconds", () => {
    const before = Date.now();
    const id = createId();
    const after = Date.now();
    const ts = getTimestamp(id);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after + 1);
  });

  test("returns same timestamp for same ID", () => {
    const id = createId();
    expect(getTimestamp(id)).toBe(getTimestamp(id));
  });

  test("IDs created in sequence have monotonically increasing timestamps", () => {
    const id1 = createId();
    const id2 = createId();
    expect(getTimestamp(id2)).toBeGreaterThanOrEqual(getTimestamp(id1));
  });
});
