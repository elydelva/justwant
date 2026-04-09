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

  test("set with tags replaces old tags on re-set", async () => {
    const adapter = memoryAdapter();
    await adapter.set("k", "v1", { tags: ["old"] });
    await adapter.set("k", "v2", { tags: ["new"] });
    const oldKeys = await adapter.getTagKeys?.("old");
    const newKeys = await adapter.getTagKeys?.("new");
    expect(oldKeys).not.toContain("k");
    expect(newKeys).toContain("k");
  });

  test("delete removes key from tag index", async () => {
    const adapter = memoryAdapter();
    await adapter.set("k", "v", { tags: ["t"] });
    await adapter.delete("k");
    const keys = await adapter.getTagKeys?.("t");
    expect(keys).not.toContain("k");
  });

  test("has returns false and prunes expired key", async () => {
    const adapter = memoryAdapter();
    await adapter.set("k", "v", { ttl: 1 });
    await new Promise((r) => setTimeout(r, 5));
    expect(await adapter.has("k")).toBe(false);
    expect(await adapter.get("k")).toBeNull();
  });

  test("getMany returns values and nulls", async () => {
    const adapter = memoryAdapter();
    await adapter.set("a", "1");
    await adapter.set("b", "2");
    const result = await adapter.getMany(["a", "b", "c"]);
    expect(result.get("a")).toBe("1");
    expect(result.get("b")).toBe("2");
    expect(result.get("c")).toBeNull();
  });

  test("setMany sets multiple entries", async () => {
    const adapter = memoryAdapter();
    await adapter.setMany([
      { key: "a", value: "1" },
      { key: "b", value: "2" },
    ]);
    expect(await adapter.get("a")).toBe("1");
    expect(await adapter.get("b")).toBe("2");
  });

  test("invalidateTags removes keys for multiple tags", async () => {
    const adapter = memoryAdapter();
    await adapter.set("a", "1", { tags: ["t1"] });
    await adapter.set("b", "2", { tags: ["t2"] });
    await adapter.invalidateTags?.(["t1", "t2"]);
    expect(await adapter.has("a")).toBe(false);
    expect(await adapter.has("b")).toBe(false);
  });

  test("deleteMany removes multiple keys and tag index", async () => {
    const adapter = memoryAdapter();
    await adapter.set("a", "1", { tags: ["t"] });
    await adapter.set("b", "2", { tags: ["t"] });
    await adapter.deleteMany?.(["a", "b"]);
    expect(await adapter.has("a")).toBe(false);
    expect(await adapter.has("b")).toBe(false);
  });
});
