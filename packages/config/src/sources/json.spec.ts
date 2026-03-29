import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, tmpdir } from "node:path";
import { defineJsonSource } from "./json.js";

describe("defineJsonSource", () => {
  test("get returns value for path", () => {
    const source = defineJsonSource({ data: { database: { url: "postgres://local" } } });
    const value = source.get({ path: "database.url" });
    expect(value).toBe("postgres://local");
  });

  test("get returns value for top-level key", () => {
    const source = defineJsonSource({ data: { apiKey: "secret" } });
    const value = source.get({ path: "apiKey" });
    expect(value).toBe("secret");
  });

  test("get returns undefined for missing path", () => {
    const source = defineJsonSource({ data: {} });
    const value = source.get({ path: "missing.nested" });
    expect(value).toBeUndefined();
  });

  test("get returns undefined for key lookup (json uses path only)", () => {
    const source = defineJsonSource({ data: { foo: "bar" } });
    const value = source.get({ key: "foo" });
    expect(value).toBeUndefined();
  });

  test("get returns null when path points to null value", () => {
    const source = defineJsonSource({ data: { a: { b: null } } });
    const value = source.get({ path: "a.b" });
    expect(value).toBeNull();
  });

  test("get returns undefined when path traverses undefined", () => {
    const source = defineJsonSource({ data: { a: {} } });
    const value = source.get({ path: "a.b.c" });
    expect(value).toBeUndefined();
  });

  test("loads from JSON file when path is given", () => {
    const dir = mkdtempSync(join(tmpdir(), "justwant-test-"));
    const file = join(dir, "config.json");
    writeFileSync(file, JSON.stringify({ db: { url: "postgres://file" } }));
    try {
      const source = defineJsonSource({ path: file });
      expect(source.get({ path: "db.url" })).toBe("postgres://file");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test("returns empty object when neither path nor data given", () => {
    const source = defineJsonSource();
    expect(source.get({ path: "anything" })).toBeUndefined();
  });
});
