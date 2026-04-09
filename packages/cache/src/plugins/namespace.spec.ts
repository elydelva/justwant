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

  test("get retrieves via prefixed key", async () => {
    const adapter = memoryAdapter();
    const cache = createCache({
      adapter,
      plugins: [namespacePlugin({ prefix: "ns" })],
    });
    await adapter.set("ns:k", JSON.stringify("hello"));
    expect(await cache.get("k")).toBe("hello");
  });

  test("set stores under prefixed key", async () => {
    const adapter = memoryAdapter();
    const cache = createCache({
      adapter,
      plugins: [namespacePlugin({ prefix: "ns" })],
    });
    await cache.set("k", "val");
    expect(await adapter.get("ns:k")).not.toBeNull();
    expect(await adapter.get("k")).toBeNull();
  });

  test("has checks prefixed key", async () => {
    const adapter = memoryAdapter();
    const cache = createCache({
      adapter,
      plugins: [namespacePlugin({ prefix: "ns" })],
    });
    await adapter.set("ns:x", "v");
    expect(await cache.has("x")).toBe(true);
    expect(await cache.has("ns:x")).toBe(false);
  });

  test("prefix with trailing colon is not doubled", async () => {
    const adapter = memoryAdapter();
    const cache = createCache({
      adapter,
      plugins: [namespacePlugin({ prefix: "app:" })],
    });
    await cache.set("k", "v");
    expect(await adapter.get("app:k")).not.toBeNull();
  });
});
