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
});
