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
});
