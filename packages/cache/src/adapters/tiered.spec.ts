import { describe, expect, test } from "bun:test";
import type { CacheAdapter } from "../types.js";
import { memoryAdapter } from "./memory.js";
import { tieredAdapter } from "./tiered.js";

function makeL1L2() {
  return { l1: memoryAdapter(), l2: memoryAdapter() };
}

/** Minimal adapter without optional bulk/tag methods */
function minimalAdapter(store: Map<string, string> = new Map()): CacheAdapter {
  return {
    async get(key) {
      return store.get(key) ?? null;
    },
    async set(key, value) {
      store.set(key, value);
    },
    async delete(key) {
      store.delete(key);
    },
    async has(key) {
      return store.has(key);
    },
  };
}

describe("tieredAdapter", () => {
  test("get returns from L1 on hit", async () => {
    const { l1, l2 } = makeL1L2();
    await l1.set("k", "v1");
    await l2.set("k", "v2");
    const adapter = tieredAdapter({ l1, l2 });
    expect(await adapter.get("k")).toBe("v1");
  });

  test("get falls back to L2 on L1 miss and populates L1", async () => {
    const { l1, l2 } = makeL1L2();
    await l2.set("k", "v2");
    const adapter = tieredAdapter({ l1, l2 });
    expect(await adapter.get("k")).toBe("v2");
    expect(await l1.get("k")).toBe("v2");
  });

  test("get returns null if missing in both", async () => {
    const adapter = tieredAdapter(makeL1L2());
    expect(await adapter.get("missing")).toBeNull();
  });

  test("set writes to both L1 and L2", async () => {
    const { l1, l2 } = makeL1L2();
    const adapter = tieredAdapter({ l1, l2 });
    await adapter.set("k", "v");
    expect(await l1.get("k")).toBe("v");
    expect(await l2.get("k")).toBe("v");
  });

  test("delete removes from both tiers", async () => {
    const { l1, l2 } = makeL1L2();
    await l1.set("k", "v");
    await l2.set("k", "v");
    const adapter = tieredAdapter({ l1, l2 });
    await adapter.delete("k");
    expect(await l1.get("k")).toBeNull();
    expect(await l2.get("k")).toBeNull();
  });

  test("has returns true if L1 has key", async () => {
    const { l1, l2 } = makeL1L2();
    await l1.set("k", "v");
    const adapter = tieredAdapter({ l1, l2 });
    expect(await adapter.has("k")).toBe(true);
  });

  test("has falls through to L2 if L1 misses", async () => {
    const { l1, l2 } = makeL1L2();
    await l2.set("k", "v");
    const adapter = tieredAdapter({ l1, l2 });
    expect(await adapter.has("k")).toBe(true);
  });

  test("getMany: L1 hits returned directly, misses filled from L2", async () => {
    const { l1, l2 } = makeL1L2();
    await l1.set("a", "l1a");
    await l2.set("b", "l2b");
    const adapter = tieredAdapter({ l1, l2 });
    const result = await adapter.getMany(["a", "b", "c"]);
    expect(result.get("a")).toBe("l1a");
    expect(result.get("b")).toBe("l2b");
    expect(result.get("c")).toBeNull();
    expect(await l1.get("b")).toBe("l2b"); // populated into L1
  });

  test("getMany: L1 without getMany falls back to per-key get", async () => {
    const l1 = minimalAdapter(new Map([["a", "v"]]));
    const l2 = memoryAdapter();
    await l2.set("b", "v2");
    const adapter = tieredAdapter({ l1, l2 });
    const result = await adapter.getMany(["a", "b"]);
    expect(result.get("a")).toBe("v");
    expect(result.get("b")).toBe("v2");
  });

  test("getMany: L2 without getMany falls back to per-key get", async () => {
    const l1 = memoryAdapter();
    const l2 = minimalAdapter(new Map([["b", "v2"]]));
    const adapter = tieredAdapter({ l1, l2 });
    const result = await adapter.getMany(["a", "b"]);
    expect(result.get("a")).toBeNull();
    expect(result.get("b")).toBe("v2");
  });

  test("setMany: delegates to setMany when available", async () => {
    const { l1, l2 } = makeL1L2();
    const adapter = tieredAdapter({ l1, l2 });
    await adapter.setMany([
      { key: "a", value: "1" },
      { key: "b", value: "2" },
    ]);
    expect(await l1.get("a")).toBe("1");
    expect(await l2.get("b")).toBe("2");
  });

  test("setMany: falls back to per-key set when setMany absent", async () => {
    const l1 = minimalAdapter();
    const l2 = minimalAdapter();
    const adapter = tieredAdapter({ l1, l2 });
    await adapter.setMany([{ key: "k", value: "v" }]);
    expect(await l1.get("k")).toBe("v");
    expect(await l2.get("k")).toBe("v");
  });

  test("deleteMany: delegates to deleteMany when available", async () => {
    const { l1, l2 } = makeL1L2();
    await l1.set("a", "1");
    await l2.set("a", "1");
    const adapter = tieredAdapter({ l1, l2 });
    await adapter.deleteMany(["a"]);
    expect(await l1.get("a")).toBeNull();
    expect(await l2.get("a")).toBeNull();
  });

  test("deleteMany: falls back to per-key delete when deleteMany absent", async () => {
    const l1Store = new Map([["k", "v"]]);
    const l2Store = new Map([["k", "v"]]);
    const l1 = minimalAdapter(l1Store);
    const l2 = minimalAdapter(l2Store);
    const adapter = tieredAdapter({ l1, l2 });
    await adapter.deleteMany(["k"]);
    expect(l1Store.has("k")).toBe(false);
    expect(l2Store.has("k")).toBe(false);
  });

  test("ttl: delegates to L1 when available", async () => {
    const { l1, l2 } = makeL1L2();
    await l1.set("k", "v");
    const adapter = tieredAdapter({ l1, l2 });
    const t = await adapter.ttl("k");
    expect(t).not.toBeUndefined();
  });

  test("ttl: falls back to L2 when L1 has no ttl", async () => {
    const l1 = minimalAdapter(new Map([["k", "v"]]));
    const l2 = memoryAdapter();
    await l2.set("k", "v");
    const adapter = tieredAdapter({ l1, l2 });
    const t = await adapter.ttl("k");
    expect(t).toBeDefined();
  });

  test("expire: delegates to both tiers", async () => {
    const { l1, l2 } = makeL1L2();
    await l1.set("k", "v");
    await l2.set("k", "v");
    const adapter = tieredAdapter({ l1, l2 });
    await expect(adapter.expire("k", 5000)).resolves.toBeUndefined();
  });

  test("persist: delegates to both tiers", async () => {
    const { l1, l2 } = makeL1L2();
    const adapter = tieredAdapter({ l1, l2 });
    await expect(adapter.persist?.("k")).resolves.toBeUndefined();
  });

  test("invalidateTag: delegates to both tiers", async () => {
    const { l1, l2 } = makeL1L2();
    await l1.set("k", "v", { tags: ["t"] });
    await l2.set("k", "v", { tags: ["t"] });
    const adapter = tieredAdapter({ l1, l2 });
    await adapter.invalidateTag?.("t");
    expect(await l1.get("k")).toBeNull();
    expect(await l2.get("k")).toBeNull();
  });

  test("invalidateTags: delegates to both tiers", async () => {
    const { l1, l2 } = makeL1L2();
    await l1.set("k", "v", { tags: ["t"] });
    const adapter = tieredAdapter({ l1, l2 });
    await adapter.invalidateTags?.(["t"]);
    expect(await l1.get("k")).toBeNull();
  });

  test("getTagKeys: returns from L1 when available", async () => {
    const { l1, l2 } = makeL1L2();
    await l1.set("k", "v", { tags: ["t"] });
    const adapter = tieredAdapter({ l1, l2 });
    const keys = await adapter.getTagKeys?.("t");
    expect(keys).toContain("k");
  });

  test("getTagKeys: falls back to L2 when L1 has no getTagKeys", async () => {
    const l1 = minimalAdapter();
    const l2 = memoryAdapter();
    await l2.set("k", "v", { tags: ["t"] });
    const adapter = tieredAdapter({ l1, l2 });
    const keys = await adapter.getTagKeys?.("t");
    expect(keys).toContain("k");
  });
});
