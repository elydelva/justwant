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
});
