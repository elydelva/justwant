import { describe, expect, mock, test } from "bun:test";
import { memoryAdapter } from "../adapters/memory.js";
import { createCache } from "../createCache.js";
import { auditPlugin } from "./audit.js";

describe("auditPlugin", () => {
  test("calls onGet with hit=false when key is missing", async () => {
    const onGet = mock();
    const cache = createCache({
      adapter: memoryAdapter(),
      plugins: [auditPlugin({ onGet })],
    });
    await cache.get("missing");
    expect(onGet).toHaveBeenCalledWith("missing", false);
  });

  test("calls onGet with hit=true when key exists", async () => {
    const onGet = mock();
    const cache = createCache({
      adapter: memoryAdapter(),
      plugins: [auditPlugin({ onGet })],
    });
    await cache.set("k", "v");
    await cache.get("k");
    expect(onGet).toHaveBeenCalledWith("k", true);
  });

  test("calls onSet after set", async () => {
    const onSet = mock();
    const cache = createCache({
      adapter: memoryAdapter(),
      plugins: [auditPlugin({ onSet })],
    });
    await cache.set("mykey", 42);
    expect(onSet).toHaveBeenCalledWith("mykey");
  });

  test("calls onDelete after delete", async () => {
    const onDelete = mock();
    const cache = createCache({
      adapter: memoryAdapter(),
      plugins: [auditPlugin({ onDelete })],
    });
    await cache.set("d", "v");
    await cache.delete("d");
    expect(onDelete).toHaveBeenCalledWith("d");
  });

  test("works with no callbacks provided", async () => {
    const cache = createCache({
      adapter: memoryAdapter(),
      plugins: [auditPlugin()],
    });
    await cache.set("x", 1);
    const v = await cache.get("x");
    expect(v).toBe(1);
    await cache.delete("x");
  });

  test("plugin name is audit", () => {
    const plugin = auditPlugin();
    expect(plugin.name).toBe("audit");
  });
});
