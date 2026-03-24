import { describe, expect, test } from "bun:test";
import { memoryAdapter } from "./memory.js";

describe("memoryAdapter", () => {
  test("get returns null for missing key", async () => {
    const adapter = memoryAdapter();
    expect(await adapter.get("x")).toBeNull();
  });

  test("set and get roundtrip", async () => {
    const adapter = memoryAdapter();
    await adapter.set("k", "v");
    expect(await adapter.get("k")).toBe("v");
  });

  test("invalidateTag removes tagged keys", async () => {
    const adapter = memoryAdapter();
    await adapter.set("k1", "v1", { tags: ["tag1"] });
    await adapter.set("k2", "v2", { tags: ["tag1"] });
    await adapter.invalidateTag("tag1");
    expect(await adapter.get("k1")).toBeNull();
    expect(await adapter.get("k2")).toBeNull();
  });

  test("getTagKeys returns keys for tag", async () => {
    const adapter = memoryAdapter();
    await adapter.set("k1", "v1", { tags: ["tag1"] });
    await adapter.set("k2", "v2", { tags: ["tag1"] });
    const keys = await adapter.getTagKeys?.("tag1");
    expect(keys).toContain("k1");
    expect(keys).toContain("k2");
  });

  test("delete removes key", async () => {
    const adapter = memoryAdapter();
    await adapter.set("k", "v");
    await adapter.delete("k");
    expect(await adapter.get("k")).toBeNull();
  });

  test("delete cleans up tag index", async () => {
    const adapter = memoryAdapter();
    await adapter.set("k", "v", { tags: ["t1"] });
    await adapter.delete("k");
    expect(await adapter.getTagKeys?.("t1")).not.toContain("k");
  });

  test("has returns true for existing key", async () => {
    const adapter = memoryAdapter();
    await adapter.set("k", "v");
    expect(await adapter.has("k")).toBe(true);
  });

  test("has returns false for missing key", async () => {
    const adapter = memoryAdapter();
    expect(await adapter.has("missing")).toBe(false);
  });

  test("expired key returns null on get", async () => {
    const adapter = memoryAdapter();
    await adapter.set("k", "v", { ttl: 1 });
    await new Promise((r) => setTimeout(r, 10));
    expect(await adapter.get("k")).toBeNull();
  });

  test("expired key returns false on has", async () => {
    const adapter = memoryAdapter();
    await adapter.set("k", "v", { ttl: 1 });
    await new Promise((r) => setTimeout(r, 10));
    expect(await adapter.has("k")).toBe(false);
  });

  test("getMany returns map with nulls for missing keys", async () => {
    const adapter = memoryAdapter();
    await adapter.set("a", "1");
    const result = await adapter.getMany!(["a", "b"]);
    expect(result.get("a")).toBe("1");
    expect(result.get("b")).toBeNull();
  });

  test("setMany sets multiple entries", async () => {
    const adapter = memoryAdapter();
    await adapter.setMany!([
      { key: "x", value: "1" },
      { key: "y", value: "2" },
    ]);
    expect(await adapter.get("x")).toBe("1");
    expect(await adapter.get("y")).toBe("2");
  });

  test("setMany with tags updates tag index", async () => {
    const adapter = memoryAdapter();
    await adapter.setMany!([{ key: "k", value: "v", opts: { tags: ["t1"] } }]);
    const keys = await adapter.getTagKeys?.("t1");
    expect(keys).toContain("k");
  });

  test("setMany updates existing key's tags correctly", async () => {
    const adapter = memoryAdapter();
    await adapter.set("k", "v1", { tags: ["old"] });
    await adapter.setMany!([{ key: "k", value: "v2", opts: { tags: ["new"] } }]);
    expect(await adapter.getTagKeys?.("old")).not.toContain("k");
    expect(await adapter.getTagKeys?.("new")).toContain("k");
  });

  test("deleteMany removes multiple keys", async () => {
    const adapter = memoryAdapter();
    await adapter.set("a", "1");
    await adapter.set("b", "2");
    await adapter.deleteMany!(["a", "b"]);
    expect(await adapter.get("a")).toBeNull();
    expect(await adapter.get("b")).toBeNull();
  });

  test("deleteMany cleans up tag index", async () => {
    const adapter = memoryAdapter();
    await adapter.set("a", "1", { tags: ["t"] });
    await adapter.deleteMany!(["a"]);
    expect(await adapter.getTagKeys?.("t")).not.toContain("a");
  });

  test("invalidateTags removes keys for multiple tags", async () => {
    const adapter = memoryAdapter();
    await adapter.set("a", "1", { tags: ["t1"] });
    await adapter.set("b", "2", { tags: ["t2"] });
    await adapter.invalidateTags!(["t1", "t2"]);
    expect(await adapter.get("a")).toBeNull();
    expect(await adapter.get("b")).toBeNull();
  });

  test("re-setting a key updates tag index", async () => {
    const adapter = memoryAdapter();
    await adapter.set("k", "v1", { tags: ["old-tag"] });
    await adapter.set("k", "v2", { tags: ["new-tag"] });
    expect(await adapter.getTagKeys?.("old-tag")).not.toContain("k");
    expect(await adapter.getTagKeys?.("new-tag")).toContain("k");
  });

  test("getTagKeys returns empty for unknown tag", async () => {
    const adapter = memoryAdapter();
    expect(await adapter.getTagKeys?.("unknown")).toEqual([]);
  });

  test("expired key in getMany returns null", async () => {
    const adapter = memoryAdapter();
    await adapter.set("k", "v", { ttl: 1 });
    await new Promise((r) => setTimeout(r, 10));
    const result = await adapter.getMany!(["k"]);
    expect(result.get("k")).toBeNull();
  });
});
