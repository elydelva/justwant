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

  test("invalidateTags removes entries for multiple tags", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.set("a", 1, { tags: ["t1"] });
    await cache.set("b", 2, { tags: ["t2"] });
    await cache.invalidateTags(["t1", "t2"]);
    expect(await cache.get("a")).toBeNull();
    expect(await cache.get("b")).toBeNull();
  });

  test("getTagKeys returns keys for tag", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.set("a", 1, { tags: ["t1"] });
    await cache.set("b", 2, { tags: ["t1"] });
    const keys = await cache.getTagKeys("t1");
    expect(keys.sort()).toEqual(["a", "b"]);
  });

  test("getMany returns map with values", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.set("a", 1);
    await cache.set("b", 2);
    const result = await cache.getMany(["a", "b", "c"]);
    expect(result.get("a")).toBe(1);
    expect(result.get("b")).toBe(2);
    expect(result.get("c")).toBeNull();
  });

  test("setMany sets multiple entries", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.setMany([
      { key: "x", value: 1 },
      { key: "y", value: 2 },
    ]);
    expect(await cache.get("x")).toBe(1);
    expect(await cache.get("y")).toBe(2);
  });

  test("deleteMany removes multiple keys", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.set("a", 1);
    await cache.set("b", 2);
    await cache.deleteMany(["a", "b"]);
    expect(await cache.get("a")).toBeNull();
    expect(await cache.get("b")).toBeNull();
  });

  test("wrapMany fetches and caches missing keys", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.set("a", "cached-a");
    const result = await cache.wrapMany(["a", "b", "c"], async (missing) => {
      return missing.map((k) => `fetched-${k}`);
    });
    expect(result.get("a")).toBe("cached-a");
    expect(result.get("b")).toBe("fetched-b");
    expect(result.get("c")).toBe("fetched-c");
    // fetched values should now be cached
    expect(await cache.get("b")).toBe("fetched-b");
  });

  test("wrapMany with keyFn stores by item key", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    const result = await cache.wrapMany(
      ["user:1", "user:2"],
      async (missing) => missing.map((k) => ({ id: k, name: `Name-${k}` })),
      { keyFn: (item) => item.id }
    );
    expect(result.get("user:1")?.name).toBe("Name-user:1");
    expect(result.get("user:2")?.name).toBe("Name-user:2");
  });

  test("ttl returns null for persistent key (memoryAdapter)", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.set("k", "v");
    const t = await cache.ttl("k");
    // memoryAdapter has no ttl method, so returns null when key exists
    expect(t).toBeNull();
  });

  test("ttl returns -1 for missing key", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    const t = await cache.ttl("missing");
    expect(t).toBe(-1);
  });

  test("expire is a no-op when adapter has no expire", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await cache.set("k", "v");
    await expect(cache.expire("k", "1h")).resolves.toBeUndefined();
  });

  test("persist is a no-op when adapter has no persist", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    await expect(cache.persist("k")).resolves.toBeUndefined();
  });

  test("namespace getMany works correctly", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    const ns = cache.namespace("users");
    await ns.set("1", { name: "Alice" });
    await ns.set("2", { name: "Bob" });
    const result = await ns.getMany(["1", "2", "3"]);
    expect(result.get("1")).toEqual({ name: "Alice" });
    expect(result.get("2")).toEqual({ name: "Bob" });
    expect(result.get("3")).toBeNull();
  });

  test("namespace setMany works correctly", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    const ns = cache.namespace("items");
    await ns.setMany([
      { key: "a", value: 1 },
      { key: "b", value: 2 },
    ]);
    expect(await ns.get("a")).toBe(1);
    expect(await ns.get("b")).toBe(2);
  });

  test("namespace deleteMany works correctly", async () => {
    const cache = createCache({ adapter: memoryAdapter() });
    const ns = cache.namespace("items");
    await ns.set("a", 1);
    await ns.set("b", 2);
    await ns.deleteMany(["a", "b"]);
    expect(await ns.get("a")).toBeNull();
    expect(await ns.get("b")).toBeNull();
  });

  test("onError=fallback returns null on get error", async () => {
    const broken = {
      get: async () => { throw new Error("broken"); },
      set: async () => {},
      delete: async () => {},
      has: async () => { throw new Error("broken"); },
    };
    const cache = createCache({ adapter: broken, onError: "fallback" });
    expect(await cache.get("k")).toBeNull();
    expect(await cache.has("k")).toBe(false);
  });
});
