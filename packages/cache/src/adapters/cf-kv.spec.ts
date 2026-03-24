import { describe, expect, test } from "bun:test";
import { cfKvAdapter } from "./cf-kv.js";

function mockKv() {
  const store = new Map<string, { value: string; expiration?: number; expirationTtl?: number }>();
  return {
    async get(key: string): Promise<string | null> {
      return store.get(key)?.value ?? null;
    },
    async put(key: string, value: string, options?: { expiration?: number; expirationTtl?: number }): Promise<void> {
      store.set(key, { value, ...options });
    },
    async delete(key: string): Promise<void> {
      store.delete(key);
    },
    async list(options?: { prefix?: string }): Promise<{ keys: { name: string }[] }> {
      const prefix = options?.prefix ?? "";
      const keys = [...store.keys()]
        .filter((k) => k.startsWith(prefix))
        .map((name) => ({ name }));
      return { keys };
    },
    _store: store,
  };
}

describe("cfKvAdapter", () => {
  test("get returns null for missing key", async () => {
    const kv = mockKv();
    const adapter = cfKvAdapter({ kv });
    expect(await adapter.get("missing")).toBeNull();
  });

  test("set and get round-trip", async () => {
    const kv = mockKv();
    const adapter = cfKvAdapter({ kv });
    await adapter.set("k", "hello");
    expect(await adapter.get("k")).toBe("hello");
  });

  test("set with ttl sets expirationTtl", async () => {
    const kv = mockKv();
    const adapter = cfKvAdapter({ kv });
    await adapter.set("k", "v", { ttl: "1m" });
    const entry = kv._store.get("k");
    expect(entry?.expirationTtl).toBe(60);
  });

  test("set with no ttl passes no options", async () => {
    const kv = mockKv();
    const adapter = cfKvAdapter({ kv });
    await adapter.set("k", "v");
    const entry = kv._store.get("k");
    expect(entry?.expirationTtl).toBeUndefined();
    expect(entry?.expiration).toBeUndefined();
  });

  test("delete removes key", async () => {
    const kv = mockKv();
    const adapter = cfKvAdapter({ kv });
    await adapter.set("k", "v");
    await adapter.delete("k");
    expect(await adapter.get("k")).toBeNull();
  });

  test("has returns true for existing key", async () => {
    const kv = mockKv();
    const adapter = cfKvAdapter({ kv });
    await adapter.set("k", "v");
    expect(await adapter.has!("k")).toBe(true);
  });

  test("has returns false for missing key", async () => {
    const kv = mockKv();
    const adapter = cfKvAdapter({ kv });
    expect(await adapter.has!("missing")).toBe(false);
  });

  test("getMany returns map", async () => {
    const kv = mockKv();
    const adapter = cfKvAdapter({ kv });
    await adapter.set("a", "1");
    await adapter.set("b", "2");
    const result = await adapter.getMany!(["a", "b", "c"]);
    expect(result.get("a")).toBe("1");
    expect(result.get("b")).toBe("2");
    expect(result.get("c")).toBeNull();
  });

  test("setMany sets multiple keys", async () => {
    const kv = mockKv();
    const adapter = cfKvAdapter({ kv });
    await adapter.setMany!([
      { key: "x", value: "1" },
      { key: "y", value: "2" },
    ]);
    expect(await adapter.get("x")).toBe("1");
    expect(await adapter.get("y")).toBe("2");
  });

  test("deleteMany deletes multiple keys", async () => {
    const kv = mockKv();
    const adapter = cfKvAdapter({ kv });
    await adapter.set("a", "1");
    await adapter.set("b", "2");
    await adapter.deleteMany!(["a", "b"]);
    expect(await adapter.get("a")).toBeNull();
    expect(await adapter.get("b")).toBeNull();
  });

  test("keyPrefix is prepended to all keys", async () => {
    const kv = mockKv();
    const adapter = cfKvAdapter({ kv, keyPrefix: "ns:" });
    await adapter.set("k", "v");
    expect(kv._store.has("ns:k")).toBe(true);
    expect(await adapter.get("k")).toBe("v");
  });
});
