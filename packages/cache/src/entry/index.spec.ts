import { describe, expect, test } from "bun:test";
import { memoryAdapter } from "../adapters/memory.js";
import { createCache } from "../createCache.js";
import { createCacheEntry } from "./index.js";

const simpleSchema = {
  "~standard": {
    validate: (v: unknown) => {
      if (typeof v === "object" && v !== null && "id" in v) {
        return { value: v };
      }
      return { issues: [{ message: "invalid" }] };
    },
  },
} as { "~standard": { validate: (v: unknown) => { value?: unknown; issues?: unknown[] } } };

describe("createCacheEntry", () => {
  test("get returns null for missing key", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    const entry = createCacheEntry({
      cache,
      key: (id) => `user:${id}`,
      schema: simpleSchema,
    });
    expect(await entry.get("123")).toBeNull();
  });

  test("set and get roundtrip with validation", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    const entry = createCacheEntry({
      cache,
      key: (id) => `user:${id}`,
      schema: simpleSchema,
    });
    await entry.set("123", { id: "123", name: "Alice" });
    const val = await entry.get("123");
    expect(val).toEqual({ id: "123", name: "Alice" });
  });

  test("wrap fetches and caches on miss", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    const entry = createCacheEntry({
      cache,
      key: (id) => `user:${id}`,
      schema: simpleSchema,
    });
    let fetches = 0;
    const fn = async () => {
      fetches++;
      return { id: "123" };
    };
    const v1 = await entry.wrap("123", fn);
    const v2 = await entry.wrap("123", fn);
    expect(v1).toEqual({ id: "123" });
    expect(v2).toEqual({ id: "123" });
    expect(fetches).toBe(1);
  });

  test("delete removes cached entry", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    const entry = createCacheEntry({ cache, key: (id) => `user:${id}`, schema: simpleSchema });
    await entry.set("1", { id: "1" });
    await entry.delete("1");
    expect(await entry.get("1")).toBeNull();
  });

  test("has returns true for existing entry", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    const entry = createCacheEntry({ cache, key: (id) => `user:${id}`, schema: simpleSchema });
    await entry.set("1", { id: "1" });
    expect(await entry.has("1")).toBe(true);
    expect(await entry.has("2")).toBe(false);
  });

  test("set throws when validation fails", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    const entry = createCacheEntry({
      cache,
      key: (id) => `user:${id}`,
      schema: simpleSchema,
    });
    await expect(entry.set("123", "not-an-object" as unknown as { id: string })).rejects.toThrow(
      "Cache entry validation failed"
    );
  });

  test("get returns null when cached value fails schema", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    const entry = createCacheEntry({
      cache,
      key: (id) => `user:${id}`,
      schema: simpleSchema,
    });
    // Bypass entry and put invalid value directly
    await cache.set("user:123", "invalid-string");
    expect(await entry.get("123")).toBeNull();
  });

  test("wrap re-fetches when cached value fails schema", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    const entry = createCacheEntry({
      cache,
      key: (id) => `user:${id}`,
      schema: simpleSchema,
    });
    await cache.set("user:123", "bad");
    let fetches = 0;
    const result = await entry.wrap("123", async () => {
      fetches++;
      return { id: "123" };
    });
    expect(result).toEqual({ id: "123" });
    expect(fetches).toBe(1);
  });

  test("get returns null when schema returns async result", async () => {
    const asyncSchema = {
      "~standard": {
        validate: (_v: unknown) => Promise.resolve({ value: _v }),
      },
    } as { "~standard": { validate: (v: unknown) => unknown } };
    const cache = createCache({ adapter: memoryAdapter() });
    const entry = createCacheEntry({
      cache,
      key: (id) => `item:${id}`,
      schema: asyncSchema,
    });
    await cache.set("item:1", "something");
    expect(await entry.get("1")).toBeNull();
  });
});
