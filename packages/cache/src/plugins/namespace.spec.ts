import { describe, expect, test } from "bun:test";
import { memoryAdapter } from "../adapters/memory.js";
import { createCache } from "../createCache.js";
import { namespacePlugin } from "./namespace.js";

describe("namespacePlugin", () => {
  test("prefixes all keys", async () => {
    const cache = createCache({
      adapter: memoryAdapter(),
      plugins: [namespacePlugin({ prefix: "app" })],
    });
    await cache.set("user:1", { id: "1" });
    const raw = await cache._internal.adapter.get("app:user:1");
    expect(raw).toContain("1");
  });

  test("does not double-colon when prefix already ends with colon", async () => {
    const adapter = memoryAdapter();
    const cache = createCache({ adapter, plugins: [namespacePlugin({ prefix: "ns:" })] });
    await cache.set("key", "val");
    expect(await adapter.get("ns:key")).not.toBeNull();
    expect(await adapter.get("ns::key")).toBeNull();
  });

  test("get retrieves via prefix", async () => {
    const cache = createCache({
      adapter: memoryAdapter(),
      plugins: [namespacePlugin({ prefix: "app" })],
    });
    await cache.set("x", 42);
    expect(await cache.get("x")).toBe(42);
  });

  test("delete removes via prefix", async () => {
    const cache = createCache({
      adapter: memoryAdapter(),
      plugins: [namespacePlugin({ prefix: "app" })],
    });
    await cache.set("x", 42);
    await cache.delete("x");
    expect(await cache.get("x")).toBeNull();
  });

  test("has returns true/false via prefix", async () => {
    const cache = createCache({
      adapter: memoryAdapter(),
      plugins: [namespacePlugin({ prefix: "app" })],
    });
    await cache.set("x", 42);
    expect(await cache.has("x")).toBe(true);
    expect(await cache.has("missing")).toBe(false);
  });

  test("plugin name is namespace", () => {
    const plugin = namespacePlugin({ prefix: "test" });
    expect(plugin.name).toBe("namespace");
  });
});
