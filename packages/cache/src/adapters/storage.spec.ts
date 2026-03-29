import { describe, expect, test } from "bun:test";
import { storageAdapter } from "./storage.js";

function makeStorage(): Storage & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    get length() { return store.size; },
    key(i) { return [...store.keys()][i] ?? null; },
    getItem(k) { return store.get(k) ?? null; },
    setItem(k, v) { store.set(k, v); },
    removeItem(k) { store.delete(k); },
    clear() { store.clear(); },
  };
}

describe("storageAdapter", () => {
  test("get/set/has/delete basic flow", async () => {
    const adapter = storageAdapter(makeStorage());
    await adapter.set("k", "v");
    expect(await adapter.get("k")).toBe("v");
    expect(await adapter.has("k")).toBe(true);
    await adapter.delete("k");
    expect(await adapter.get("k")).toBeNull();
    expect(await adapter.has("k")).toBe(false);
  });

  test("set without TTL clears existing TTL entry", async () => {
    const storage = makeStorage();
    const adapter = storageAdapter(storage);
    // Set with TTL first
    await adapter.set("k", "v1", { ttl: 60000 });
    expect(storage.getItem("__ttl:k")).not.toBeNull();
    // Set without TTL — should clear TTL key
    await adapter.set("k", "v2");
    expect(storage.getItem("__ttl:k")).toBeNull();
    expect(await adapter.get("k")).toBe("v2");
  });

  test("get returns null for expired key", async () => {
    const storage = makeStorage();
    const adapter = storageAdapter(storage);
    // Manually plant an expired TTL
    storage.setItem("k", "v");
    storage.setItem("__ttl:k", String(Date.now() - 1000));
    expect(await adapter.get("k")).toBeNull();
  });

  test("getMany returns values and nulls", async () => {
    const adapter = storageAdapter(makeStorage());
    await adapter.set("a", "1");
    await adapter.set("b", "2");
    const result = await adapter.getMany?.(["a", "b", "c"]);
    expect(result?.get("a")).toBe("1");
    expect(result?.get("b")).toBe("2");
    expect(result?.get("c")).toBeNull();
  });

  test("setMany sets multiple keys", async () => {
    const adapter = storageAdapter(makeStorage());
    await adapter.setMany?.([
      { key: "a", value: "1" },
      { key: "b", value: "2" },
    ]);
    expect(await adapter.get("a")).toBe("1");
    expect(await adapter.get("b")).toBe("2");
  });

  test("deleteMany removes multiple keys", async () => {
    const adapter = storageAdapter(makeStorage());
    await adapter.set("a", "1");
    await adapter.set("b", "2");
    await adapter.deleteMany?.(["a", "b"]);
    expect(await adapter.has("a")).toBe(false);
    expect(await adapter.has("b")).toBe(false);
  });

  test("invalidateTag removes tagged keys", async () => {
    const adapter = storageAdapter(makeStorage());
    await adapter.set("k", "v", { tags: ["t1"] });
    await adapter.invalidateTag?.("t1");
    expect(await adapter.has("k")).toBe(false);
  });

});
