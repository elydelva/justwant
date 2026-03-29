import { describe, expect, test } from "bun:test";
import { vercelKvAdapter } from "./vercel-kv.js";
import type { VercelKvAdapterOptions } from "./vercel-kv.js";

function makeKv(store: Map<string, string> = new Map()): VercelKvAdapterOptions["kv"] {
  const expires = new Map<string, number>();
  return {
    async get(key) { return store.get(key) ?? null; },
    async set(key, value, opts) {
      store.set(key, value);
      if (opts?.ex) expires.set(key, opts.ex);
      return "OK";
    },
    async del(...keys) {
      let n = 0;
      for (const k of keys) if (store.delete(k)) n++;
      return n;
    },
    async exists(key) { return store.has(key) ? 1 : 0; },
    async mget(...keys) { return keys.map((k) => store.get(k) ?? null); },
    async mset(obj) {
      for (const [k, v] of Object.entries(obj)) store.set(k, v as string);
      return "OK";
    },
    async expire(key, seconds) { expires.set(key, seconds); return 1; },
    async ttl(key) {
      if (!store.has(key)) return -2;
      const exp = expires.get(key);
      return exp === undefined ? -1 : exp;
    },
  };
}

describe("vercelKvAdapter", () => {
  test("basic get/set/has/delete", async () => {
    const adapter = vercelKvAdapter({ kv: makeKv() });
    await adapter.set("k", "v");
    expect(await adapter.get("k")).toBe("v");
    expect(await adapter.has("k")).toBe(true);
    await adapter.delete("k");
    expect(await adapter.get("k")).toBeNull();
  });

  test("getMany returns map with nulls for missing keys", async () => {
    const store = new Map([["a", "1"], ["b", "2"]]);
    const adapter = vercelKvAdapter({ kv: makeKv(store) });
    const result = await adapter.getMany(["a", "b", "c"]);
    expect(result.get("a")).toBe("1");
    expect(result.get("b")).toBe("2");
    expect(result.get("c")).toBeNull();
  });

  test("setMany sets all keys", async () => {
    const adapter = vercelKvAdapter({ kv: makeKv() });
    await adapter.setMany?.([
      { key: "a", value: "1" },
      { key: "b", value: "2" },
    ]);
    expect(await adapter.get("a")).toBe("1");
    expect(await adapter.get("b")).toBe("2");
  });

  test("deleteMany removes keys", async () => {
    const store = new Map([["a", "1"], ["b", "2"]]);
    const adapter = vercelKvAdapter({ kv: makeKv(store) });
    await adapter.deleteMany?.(["a", "b"]);
    expect(await adapter.has("a")).toBe(false);
  });

  test("keyPrefix is applied to all operations", async () => {
    const store = new Map<string, string>();
    const adapter = vercelKvAdapter({ kv: makeKv(store), keyPrefix: "p:" });
    await adapter.set("k", "v");
    expect(store.has("p:k")).toBe(true);
    expect(await adapter.get("k")).toBe("v");
  });
});
