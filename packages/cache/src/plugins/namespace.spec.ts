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
});
