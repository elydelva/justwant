import { describe, expect, test } from "bun:test";
import { redisAdapter } from "./redis.js";
import type { RedisClient } from "./redis.js";

function makeRedis(store: Map<string, string> = new Map()): RedisClient & {
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
    async set(key, value, ...args) {
      store.set(key, value);
      const exIdx = (args as unknown[]).indexOf("EX");
      if (exIdx >= 0) expires.set(key, args[exIdx + 1] as number);
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
    async mset(...args) {
      for (let i = 0; i < args.length; i += 2) {
        store.set(args[i] as string, args[i + 1] as string);
      }
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

describe("redisAdapter", () => {
  test("get returns null for missing key", async () => {
    const adapter = redisAdapter({ redis: makeRedis() });
    expect(await adapter.get("x")).toBeNull();
  });

  test("set and get roundtrip", async () => {
    const adapter = redisAdapter({ redis: makeRedis() });
    await adapter.set("k", "v");
    expect(await adapter.get("k")).toBe("v");
  });

  test("set with TTL calls expire", async () => {
    const redis = makeRedis();
    const adapter = redisAdapter({ redis });
    await adapter.set("k", "v", { ttl: 5000 });
    expect(redis.expires.get("k")).toBe(5);
  });

  test("set with Date TTL calls set with EX", async () => {
    const redis = makeRedis();
    const adapter = redisAdapter({ redis });
    const future = new Date(Date.now() + 10000);
    await adapter.set("k", "v", { ttl: future });
    const exp = redis.expires.get("k");
    expect(typeof exp).toBe("number");
    expect(exp as number).toBeGreaterThan(0);
  });

  test("set with tags registers key in tag sets", async () => {
    const redis = makeRedis();
    const adapter = redisAdapter({ redis });
    await adapter.set("k", "v", { tags: ["t1"] });
    expect(redis.tags.get("tag:t1")?.has("k")).toBe(true);
  });

  test("set with keyPrefix prefixes tag set membership", async () => {
    const redis = makeRedis();
    const adapter = redisAdapter({ redis, keyPrefix: "pfx:" });
    await adapter.set("k", "v", { tags: ["t1"] });
    expect(redis.tags.get("tag:t1")?.has("pfx:k")).toBe(true);
  });

  test("delete removes key", async () => {
    const store = new Map([["k", "v"]]);
    const adapter = redisAdapter({ redis: makeRedis(store) });
    await adapter.delete("k");
    expect(store.has("k")).toBe(false);
  });

  test("has returns true for existing key", async () => {
    const store = new Map([["k", "v"]]);
    const adapter = redisAdapter({ redis: makeRedis(store) });
    expect(await adapter.has("k")).toBe(true);
  });

  test("has returns false for missing key", async () => {
    const adapter = redisAdapter({ redis: makeRedis() });
    expect(await adapter.has("missing")).toBe(false);
  });

  test("getMany returns map of values", async () => {
    const store = new Map([
      ["a", "1"],
      ["b", "2"],
    ]);
    const adapter = redisAdapter({ redis: makeRedis(store) });
    const result = await adapter.getMany(["a", "b", "c"]);
    expect(result.get("a")).toBe("1");
    expect(result.get("b")).toBe("2");
    expect(result.get("c")).toBeNull();
  });

  test("setMany sets all keys", async () => {
    const redis = makeRedis();
    const adapter = redisAdapter({ redis });
    await adapter.setMany([
      { key: "a", value: "1" },
      { key: "b", value: "2" },
    ]);
    expect(await adapter.get("a")).toBe("1");
    expect(await adapter.get("b")).toBe("2");
  });

  test("setMany applies TTL per entry", async () => {
    const redis = makeRedis();
    const adapter = redisAdapter({ redis });
    await adapter.setMany([{ key: "a", value: "1", opts: { ttl: 3000 } }]);
    expect(redis.expires.get("a")).toBe(3);
  });

  test("deleteMany removes all keys", async () => {
    const store = new Map([
      ["a", "1"],
      ["b", "2"],
    ]);
    const adapter = redisAdapter({ redis: makeRedis(store) });
    await adapter.deleteMany(["a", "b"]);
    expect(store.size).toBe(0);
  });

  test("deleteMany with empty array is a no-op", async () => {
    const store = new Map([["a", "1"]]);
    const adapter = redisAdapter({ redis: makeRedis(store) });
    await adapter.deleteMany([]);
    expect(store.size).toBe(1);
  });

  test("ttl returns ms for existing key with expiry", async () => {
    const redis = makeRedis(new Map([["k", "v"]]));
    redis.expires.set("k", 10);
    const adapter = redisAdapter({ redis });
    expect(await adapter.ttl("k")).toBe(10000);
  });

  test("ttl returns null for key without expiry", async () => {
    const adapter = redisAdapter({ redis: makeRedis(new Map([["k", "v"]])) });
    expect(await adapter.ttl("k")).toBeNull();
  });

  test("ttl returns -1 for missing key", async () => {
    const adapter = redisAdapter({ redis: makeRedis() });
    expect(await adapter.ttl("missing")).toBe(-1);
  });

  test("expire sets expiry in seconds", async () => {
    const redis = makeRedis(new Map([["k", "v"]]));
    const adapter = redisAdapter({ redis });
    await adapter.expire("k", 5000);
    expect(redis.expires.get("k")).toBe(5);
  });

  test("expire with Date sets expiry", async () => {
    const redis = makeRedis(new Map([["k", "v"]]));
    const adapter = redisAdapter({ redis });
    await adapter.expire("k", new Date(Date.now() + 8000));
    expect(redis.expires.get("k")).toBeGreaterThan(0);
  });

  test("expire with undefined TTL is a no-op", async () => {
    const redis = makeRedis(new Map([["k", "v"]]));
    const adapter = redisAdapter({ redis });
    await adapter.expire("k", undefined as unknown as number);
    expect(redis.expires.has("k")).toBe(false);
  });

  test("invalidateTag deletes tagged keys", async () => {
    const redis = makeRedis(
      new Map([
        ["k1", "v1"],
        ["k2", "v2"],
      ])
    );
    const adapter = redisAdapter({ redis });
    await adapter.set("k1", "v1", { tags: ["t1"] });
    await adapter.set("k2", "v2", { tags: ["t1"] });
    await adapter.invalidateTag("t1");
    expect(await adapter.get("k1")).toBeNull();
    expect(await adapter.get("k2")).toBeNull();
  });

  test("invalidateTag is no-op without smembers support", async () => {
    const redis = makeRedis();
    const { sadd: _a, smembers: _b, srem: _c, ...noSetRedis } = redis;
    const adapter = redisAdapter({ redis: noSetRedis });
    await expect(adapter.invalidateTag?.("t1")).resolves.toBeUndefined();
  });

  test("invalidateTags invalidates multiple tags", async () => {
    const redis = makeRedis(
      new Map([
        ["k1", "v1"],
        ["k2", "v2"],
      ])
    );
    const adapter = redisAdapter({ redis });
    await adapter.set("k1", "v1", { tags: ["t1"] });
    await adapter.set("k2", "v2", { tags: ["t2"] });
    await adapter.invalidateTags?.(["t1", "t2"]);
    expect(await adapter.get("k1")).toBeNull();
    expect(await adapter.get("k2")).toBeNull();
  });

  test("getTagKeys returns unprefixed keys", async () => {
    const redis = makeRedis();
    const adapter = redisAdapter({ redis, keyPrefix: "pfx:" });
    await adapter.set("k1", "v", { tags: ["t1"] });
    const keys = await adapter.getTagKeys?.("t1");
    expect(keys).toContain("k1");
  });

  test("getTagKeys returns empty array without smembers", async () => {
    const redis = makeRedis();
    const { smembers: _, ...noSmembers } = redis;
    const adapter = redisAdapter({ redis: noSmembers });
    expect(await adapter.getTagKeys?.("t1")).toEqual([]);
  });
});
