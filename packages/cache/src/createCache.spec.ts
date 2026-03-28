import { describe, expect, test } from "bun:test";
import { memoryAdapter } from "./adapters/memory.js";
import { createCache } from "./createCache.js";

describe("createCache", () => {
  test("get returns null for missing key", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    const val = await cache.get("missing");
    expect(val).toBeNull();
  });

  test("set and get roundtrip", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.set("k1", { foo: "bar" });
    const val = await cache.get<{ foo: string }>("k1");
    expect(val).toEqual({ foo: "bar" });
  });

  test("delete removes key", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.set("k1", "v1");
    await cache.delete("k1");
    expect(await cache.get("k1")).toBeNull();
  });

  test("has returns true for existing key", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.set("k1", "v1");
    expect(await cache.has("k1")).toBe(true);
  });

  test("has returns false for missing key", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    expect(await cache.has("missing")).toBe(false);
  });

  test("wrap fetches and caches on miss", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    let fetches = 0;
    const fn = async () => {
      fetches++;
      return { id: "123" };
    };
    const v1 = await cache.wrap("user:123", fn);
    const v2 = await cache.wrap("user:123", fn);
    expect(v1).toEqual({ id: "123" });
    expect(v2).toEqual({ id: "123" });
    expect(fetches).toBe(1);
  });

  test("pull returns and deletes", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.set("otp:1", "abc");
    const v = await cache.pull("otp:1");
    expect(v).toBe("abc");
    expect(await cache.get("otp:1")).toBeNull();
  });

  test("setNx returns true when key did not exist", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    const ok = await cache.setNx("lock:1", "1");
    expect(ok).toBe(true);
    expect(await cache.get("lock:1")).toBe("1");
  });

  test("setNx returns false when key exists", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.set("lock:1", "1");
    const ok = await cache.setNx("lock:1", "2");
    expect(ok).toBe(false);
    expect(await cache.get("lock:1")).toBe("1");
  });

  test("namespace prefixes keys", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    const userCache = cache.namespace("users");
    await userCache.set("123", { name: "Alice" });
    const raw = await cache.get("users:123");
    expect(raw).toEqual({ name: "Alice" });
  });

  test("invalidateTag removes tagged entries", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.set("a", 1, { tags: ["t1"] });
    await cache.set("b", 2, { tags: ["t1"] });
    await cache.invalidateTag("t1");
    expect(await cache.get("a")).toBeNull();
    expect(await cache.get("b")).toBeNull();
  });

  test("invalidateTags with adapter.invalidateTags", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.set("a", 1, { tags: ["t1"] });
    await cache.set("b", 2, { tags: ["t2"] });
    await cache.invalidateTags(["t1", "t2"]);
    expect(await cache.get("a")).toBeNull();
    expect(await cache.get("b")).toBeNull();
  });

  test("invalidateTags without adapter.invalidateTags falls back to per-tag", async () => {
    const adapter = memoryAdapter();
    const { invalidateTags: _, ...noInvalidateTags } = adapter as typeof adapter & {
      invalidateTags?: unknown;
    };
    const cache = createCache({ adapter: noInvalidateTags as typeof adapter });
    await cache.set("a", 1, { tags: ["t1"] });
    await cache.invalidateTags(["t1"]);
    expect(await cache.get("a")).toBeNull();
  });

  test("getTagKeys returns keys for tag", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.set("k1", "v1", { tags: ["t1"] });
    const keys = await cache.getTagKeys("t1");
    expect(keys).toContain("k1");
  });

  test("getTagKeys returns empty array when adapter lacks getTagKeys", async () => {
    const adapter = memoryAdapter();
    const { getTagKeys: _, ...noGetTagKeys } = adapter as typeof adapter & {
      getTagKeys?: unknown;
    };
    const cache = createCache({ adapter: noGetTagKeys as typeof adapter });
    expect(await cache.getTagKeys("t1")).toEqual([]);
  });

  test("getMany via adapter.getMany", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.set("a", 1);
    await cache.set("b", 2);
    const result = await cache.getMany(["a", "b", "c"]);
    expect(result.get("a")).toBe(1);
    expect(result.get("b")).toBe(2);
    expect(result.get("c")).toBeNull();
  });

  test("setMany via adapter.setMany", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.setMany([
      { key: "a", value: 1 },
      { key: "b", value: 2 },
    ]);
    expect(await cache.get("a")).toBe(1);
    expect(await cache.get("b")).toBe(2);
  });

  test("deleteMany via adapter.deleteMany", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.set("a", 1);
    await cache.set("b", 2);
    await cache.deleteMany(["a", "b"]);
    expect(await cache.get("a")).toBeNull();
    expect(await cache.get("b")).toBeNull();
  });

  test("ttl returns null for key without expiry", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.set("k", "v");
    expect(await cache.ttl("k")).toBeNull();
  });

  test("ttl returns -1 for missing key", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    expect(await cache.ttl("missing")).toBe(-1);
  });

  test("expire delegates to adapter", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.set("k", "v");
    await expect(cache.expire("k", 5000)).resolves.toBeUndefined();
  });

  test("persist delegates to adapter", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.set("k", "v");
    await expect(cache.persist("k")).resolves.toBeUndefined();
  });

  test("wrapMany returns cached + fetched values", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.set("a", "cached");
    const result = await cache.wrapMany(["a", "b"], async (missing) =>
      missing.map((k) => `fetched:${k}`)
    );
    expect(result.get("a")).toBe("cached");
    expect(result.get("b")).toBe("fetched:b");
  });

  test("wrapMany with keyFn uses returned item key", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    const result = await cache.wrapMany(
      ["user:1", "user:2"],
      async () => [
        { id: "user:1", name: "Alice" },
        { id: "user:2", name: "Bob" },
      ],
      { keyFn: (item) => item.id }
    );
    expect(result.get("user:1")).toEqual({ id: "user:1", name: "Alice" });
  });

  test("onError=throw re-throws errors", async () => {
    const adapter = memoryAdapter();
    const orig = adapter.get.bind(adapter);
    adapter.get = async (k) => {
      if (k === "boom") throw new Error("boom");
      return orig(k);
    };
    const cache = createCache({ adapter, onError: "throw" });
    await expect(cache.get("boom")).rejects.toThrow("boom");
  });

  test("onError=fallback returns fallback silently", async () => {
    const adapter = memoryAdapter();
    adapter.get = async () => {
      throw new Error("fail");
    };
    const cache = createCache({ adapter, onError: "fallback" });
    expect(await cache.get("k")).toBeNull();
  });

  test("onError=silent logs to console and returns fallback", async () => {
    const adapter = memoryAdapter();
    const orig = adapter.get.bind(adapter);
    adapter.get = async (k) => {
      if (k === "fail-key") throw new Error("silent-fail");
      return orig(k);
    };
    const cache = createCache({ adapter, onError: "silent" });
    expect(await cache.get("fail-key")).toBeNull();
  });

  test("getMany without adapter.getMany falls back to per-key get", async () => {
    const store = new Map<string, string>();
    const bare: import("./types.js").CacheAdapter = {
      async get(k) {
        return store.get(k) ?? null;
      },
      async set(k, v) {
        store.set(k, v);
      },
      async delete(k) {
        store.delete(k);
      },
      async has(k) {
        return store.has(k);
      },
    };
    const cache = createCache({ adapter: bare });
    await cache.set("a", 1);
    const result = await cache.getMany(["a", "b"]);
    expect(result.get("a")).toBe(1);
    expect(result.get("b")).toBeNull();
  });

  test("setMany without adapter.setMany falls back to per-key set", async () => {
    const store = new Map<string, string>();
    const bare: import("./types.js").CacheAdapter = {
      async get(k) {
        return store.get(k) ?? null;
      },
      async set(k, v) {
        store.set(k, v);
      },
      async delete(k) {
        store.delete(k);
      },
      async has(k) {
        return store.has(k);
      },
    };
    const cache = createCache({ adapter: bare });
    await cache.setMany([
      { key: "a", value: 1 },
      { key: "b", value: 2 },
    ]);
    expect(await cache.get("a")).toBe(1);
    expect(await cache.get("b")).toBe(2);
  });

  test("deleteMany without adapter.deleteMany falls back to per-key delete", async () => {
    const store = new Map<string, string>();
    const bare: import("./types.js").CacheAdapter = {
      async get(k) {
        return store.get(k) ?? null;
      },
      async set(k, v) {
        store.set(k, v);
      },
      async delete(k) {
        store.delete(k);
      },
      async has(k) {
        return store.has(k);
      },
    };
    const cache = createCache({ adapter: bare });
    await cache.set("a", 1);
    await cache.set("b", 2);
    await cache.deleteMany(["a", "b"]);
    expect(await cache.get("a")).toBeNull();
    expect(await cache.get("b")).toBeNull();
  });

  test("ttl without adapter.ttl: returns null for existing key, -1 for missing", async () => {
    const store = new Map<string, string>();
    const bare: import("./types.js").CacheAdapter = {
      async get(k) {
        return store.get(k) ?? null;
      },
      async set(k, v) {
        store.set(k, v);
      },
      async delete(k) {
        store.delete(k);
      },
      async has(k) {
        return store.has(k);
      },
    };
    const cache = createCache({ adapter: bare });
    await cache.set("k", "v");
    expect(await cache.ttl("k")).toBeNull();
    expect(await cache.ttl("missing")).toBe(-1);
  });

  test("plugin with get/set/delete/has hooks wraps chain", async () => {
    const calls: string[] = [];
    const plugin: import("./types.js").CachePlugin = {
      name: "spy",
      get: async (key, next) => {
        calls.push(`get:${key}`);
        return next();
      },
      set: async (key, value, opts, next) => {
        calls.push(`set:${key}`);
        return next();
      },
      delete: async (key, next) => {
        calls.push(`del:${key}`);
        return next();
      },
      has: async (key, next) => {
        calls.push(`has:${key}`);
        return next();
      },
    };
    const cache = createCache({ adapter: memoryAdapter(), plugins: [plugin] });
    await cache.set("k", "v");
    await cache.get("k");
    await cache.has("k");
    await cache.delete("k");
    expect(calls).toContain("set:k");
    expect(calls).toContain("get:k");
    expect(calls).toContain("has:k");
    expect(calls).toContain("del:k");
  });

  test("plugin init is called with context", async () => {
    let initCalled = false;
    const plugin: import("./types.js").CachePlugin = {
      name: "init-spy",
      init: () => {
        initCalled = true;
      },
    };
    createCache({ adapter: memoryAdapter(), plugins: [plugin] });
    expect(initCalled).toBe(true);
  });

  test("deserialize returns null on invalid JSON", async () => {
    const store = new Map<string, string>([["k", "not-json{{{"]]);
    const bare: import("./types.js").CacheAdapter = {
      async get(k) {
        return store.get(k) ?? null;
      },
      async set(k, v) {
        store.set(k, v);
      },
      async delete(k) {
        store.delete(k);
      },
      async has(k) {
        return store.has(k);
      },
    };
    const cache = createCache({ adapter: bare });
    expect(await cache.get("k")).toBeNull();
  });
});
