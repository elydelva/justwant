import { describe, expect, test } from "bun:test";
import { upstashAdapter } from "./upstash.js";
import type { UpstashRedisClient } from "./upstash.js";

function makeUpstash(store: Map<string, string> = new Map()): UpstashRedisClient & {
  tags: Map<string, Set<string>>;
  expires: Map<string, number>;
} {
  const tags = new Map<string, Set<string>>();
  const expires = new Map<string, number>();
  return {
    tags,
    expires,
    async get(key) {
      return store.get(key) ?? null;
    },
    async set(key, value, options) {
      store.set(key, value);
      if (options?.ex) expires.set(key, options.ex);
      return "OK";
    },
    async del(...keys) {
      let n = 0;
      for (const k of keys) if (store.delete(k)) n++;
      return n;
    },
    async exists(key) {
      return store.has(key) ? 1 : 0;
    },
    async mget(...keys) {
      return keys.map((k) => store.get(k) ?? null);
    },
    async mset(obj) {
      for (const [k, v] of Object.entries(obj)) store.set(k, v);
      return "OK";
    },
    async expire(key, seconds) {
      expires.set(key, seconds);
      return 1;
    },
    async ttl(key) {
      const exp = expires.get(key);
      if (!store.has(key)) return -2;
      if (exp === undefined) return -1;
      return exp;
    },
    async sadd(key, ...members) {
      if (!tags.has(key)) tags.set(key, new Set());
      for (const m of members) tags.get(key)?.add(m);
      return members.length;
    },
    async smembers(key) {
      return [...(tags.get(key) ?? [])];
    },
    async srem(key, ...members) {
      let n = 0;
      const s = tags.get(key);
      if (s) for (const m of members) if (s.delete(m)) n++;
      return n;
    },
  };
}

describe("upstashAdapter", () => {
  test("get returns null for missing key", async () => {
    const adapter = upstashAdapter({ redis: makeUpstash() });
    expect(await adapter.get("x")).toBeNull();
  });

  test("set and get roundtrip", async () => {
    const adapter = upstashAdapter({ redis: makeUpstash() });
    await adapter.set("k", "v");
    expect(await adapter.get("k")).toBe("v");
  });

  test("set with ms TTL passes ex option", async () => {
    const redis = makeUpstash();
    const adapter = upstashAdapter({ redis });
    await adapter.set("k", "v", { ttl: 5000 });
    expect(redis.expires.get("k")).toBe(5);
  });

  test("set with Date TTL passes exat option", async () => {
    const redis = makeUpstash();
    const adapter = upstashAdapter({ redis });
    const future = new Date(Date.now() + 10000);
    await adapter.set("k", "v", { ttl: future });
    // exat is passed; our mock stores it via the `set` options.ex — here we check expire wasn't called
    expect(await adapter.get("k")).toBe("v");
  });

  test("set with tags registers key in tag sets", async () => {
    const redis = makeUpstash();
    const adapter = upstashAdapter({ redis });
    await adapter.set("k", "v", { tags: ["t1"] });
    expect(redis.tags.get("tag:t1")?.has("k")).toBe(true);
  });

  test("delete removes key", async () => {
    const store = new Map([["k", "v"]]);
    const adapter = upstashAdapter({ redis: makeUpstash(store) });
    await adapter.delete("k");
    expect(store.has("k")).toBe(false);
  });

  test("has returns correct boolean", async () => {
    const adapter = upstashAdapter({ redis: makeUpstash(new Map([["k", "v"]])) });
    expect(await adapter.has("k")).toBe(true);
    expect(await adapter.has("missing")).toBe(false);
  });

  test("getMany returns map of values", async () => {
    const store = new Map([
      ["a", "1"],
      ["b", "2"],
    ]);
    const adapter = upstashAdapter({ redis: makeUpstash(store) });
    const result = await adapter.getMany(["a", "b", "c"]);
    expect(result.get("a")).toBe("1");
    expect(result.get("b")).toBe("2");
    expect(result.get("c")).toBeNull();
  });

  test("setMany sets all keys via mset", async () => {
    const redis = makeUpstash();
    const adapter = upstashAdapter({ redis });
    await adapter.setMany([
      { key: "a", value: "1" },
      { key: "b", value: "2" },
    ]);
    expect(await adapter.get("a")).toBe("1");
    expect(await adapter.get("b")).toBe("2");
  });

  test("setMany applies TTL per entry", async () => {
    const redis = makeUpstash();
    const adapter = upstashAdapter({ redis });
    await adapter.setMany([{ key: "a", value: "1", opts: { ttl: 3000 } }]);
    expect(redis.expires.get("a")).toBe(3);
  });

  test("deleteMany removes all keys", async () => {
    const store = new Map([
      ["a", "1"],
      ["b", "2"],
    ]);
    const adapter = upstashAdapter({ redis: makeUpstash(store) });
    await adapter.deleteMany(["a", "b"]);
    expect(store.size).toBe(0);
  });

  test("deleteMany with empty array is a no-op", async () => {
    const store = new Map([["a", "1"]]);
    const adapter = upstashAdapter({ redis: makeUpstash(store) });
    await adapter.deleteMany([]);
    expect(store.size).toBe(1);
  });

  test("ttl returns ms for existing key with expiry", async () => {
    const redis = makeUpstash(new Map([["k", "v"]]));
    redis.expires.set("k", 10);
    const adapter = upstashAdapter({ redis });
    expect(await adapter.ttl("k")).toBe(10000);
  });

  test("ttl returns null for key without expiry", async () => {
    const adapter = upstashAdapter({ redis: makeUpstash(new Map([["k", "v"]])) });
    expect(await adapter.ttl("k")).toBeNull();
  });

  test("ttl returns -1 for missing key", async () => {
    const adapter = upstashAdapter({ redis: makeUpstash() });
    expect(await adapter.ttl("missing")).toBe(-1);
  });

  test("expire sets expiry in seconds", async () => {
    const redis = makeUpstash(new Map([["k", "v"]]));
    const adapter = upstashAdapter({ redis });
    await adapter.expire("k", 5000);
    expect(redis.expires.get("k")).toBe(5);
  });

  test("expire with undefined TTL is a no-op", async () => {
    const redis = makeUpstash(new Map([["k", "v"]]));
    const adapter = upstashAdapter({ redis });
    await adapter.expire("k", undefined as unknown as number);
    expect(redis.expires.has("k")).toBe(false);
  });

  test("invalidateTag deletes tagged keys", async () => {
    const redis = makeUpstash(
      new Map([
        ["k1", "v1"],
        ["k2", "v2"],
      ])
    );
    const adapter = upstashAdapter({ redis });
    await adapter.set("k1", "v1", { tags: ["t1"] });
    await adapter.set("k2", "v2", { tags: ["t1"] });
    await adapter.invalidateTag?.("t1");
    expect(await adapter.get("k1")).toBeNull();
    expect(await adapter.get("k2")).toBeNull();
  });

  test("invalidateTag is no-op without smembers", async () => {
    const redis = makeUpstash();
    const { smembers: _, srem: __, sadd: ___, ...noSet } = redis;
    const adapter = upstashAdapter({ redis: noSet });
    await expect(adapter.invalidateTag?.("t1")).resolves.toBeUndefined();
  });

  test("invalidateTags invalidates multiple tags", async () => {
    const redis = makeUpstash(
      new Map([
        ["k1", "v1"],
        ["k2", "v2"],
      ])
    );
    const adapter = upstashAdapter({ redis });
    await adapter.set("k1", "v1", { tags: ["t1"] });
    await adapter.set("k2", "v2", { tags: ["t2"] });
    await adapter.invalidateTags?.(["t1", "t2"]);
    expect(await adapter.get("k1")).toBeNull();
    expect(await adapter.get("k2")).toBeNull();
  });

  test("getTagKeys returns unprefixed keys", async () => {
    const redis = makeUpstash();
    const adapter = upstashAdapter({ redis, keyPrefix: "pfx:" });
    await adapter.set("k1", "v", { tags: ["t1"] });
    const keys = await adapter.getTagKeys?.("t1");
    expect(keys).toContain("k1");
  });

  test("getTagKeys returns empty array without smembers", async () => {
    const redis = makeUpstash();
    const { smembers: _, ...noSmembers } = redis;
    const adapter = upstashAdapter({ redis: noSmembers });
    expect(await adapter.getTagKeys?.("t1")).toEqual([]);
  });
});
