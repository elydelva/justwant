import { describe, expect, test } from "bun:test";
import { createId } from "./short.js";

describe("createId", () => {
  test("returns string when called without size", () => {
    const id = createId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  test("default length is 21 characters", () => {
    const id = createId();
    expect(id).toHaveLength(21);
  });

  test("returns URL-safe characters", () => {
    const id = createId();
    expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  test("respects size parameter", () => {
    const id = createId(8);
    expect(id).toHaveLength(8);
  });

  test("generates unique IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(createId());
    }
    expect(ids.size).toBe(100);
  });

  test("size 0 returns empty string", () => {
    const id = createId(0);
    expect(id).toBe("");
  });

  test("different sizes produce correct lengths", () => {
    expect(createId(1)).toHaveLength(1);
    expect(createId(16)).toHaveLength(16);
    expect(createId(32)).toHaveLength(32);
  });
});
