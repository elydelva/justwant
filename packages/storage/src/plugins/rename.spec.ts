import { describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStorageService } from "../createStorageService.js";
import { defineBucket } from "../defineBucket.js";
import { defineLocalSource } from "../local/index.js";
import { renamePlugin } from "./rename.js";

describe("renamePlugin", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "rename-test-"));

  test("sanitize removes dangerous chars", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "test" });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      plugins: [renamePlugin({ sanitize: true })],
      onError: "throw",
    });

    const result = await storage.upload({
      path: "foo/bar<>:baz.txt",
      data: "x",
    });
    expect(result.path).not.toContain("<");
    expect(result.path).not.toContain(">");
  });

  test("uuid strategy generates unique path", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "uuid" });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      plugins: [renamePlugin({ strategy: "uuid" })],
      onError: "throw",
    });

    const result = await storage.upload({
      path: "dir/file.jpg",
      data: Buffer.from("image"),
      options: { contentType: "image/jpeg" },
    });
    expect(result.path).toMatch(/^dir\/[0-9a-f-]{36}\.jpg$/);
  });

  test("hash strategy generates deterministic path from content", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "hash" });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      plugins: [renamePlugin({ strategy: "hash" })],
      onError: "throw",
    });

    const data = Buffer.from("same content");
    const result1 = await storage.upload({
      path: "dir/file.jpg",
      data,
      options: { contentType: "image/jpeg" },
    });
    const result2 = await storage.upload({
      path: "dir/other.jpg",
      data,
      options: { contentType: "image/jpeg" },
    });
    expect(result1.path).toMatch(/^dir\/[a-f0-9]{16}\.jpg$/);
    expect(result2.path).toMatch(/^dir\/[a-f0-9]{16}\.jpg$/);
    expect(result1.path).toBe(result2.path);
  });

  test("slug strategy normalizes filename", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "slug" });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      plugins: [renamePlugin({ strategy: "slug" })],
      onError: "throw",
    });

    const result = await storage.upload({
      path: "dir/My Cool Image 2024.jpg",
      data: Buffer.from("x"),
      options: { contentType: "image/jpeg" },
    });
    expect(result.path).toMatch(/^dir\/my-cool-image-2024\.jpg$/);
  });
});
