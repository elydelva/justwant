import { describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStorageService } from "./createStorageService.js";
import { defineBucket } from "./defineBucket.js";
import { defineLocalSource } from "./local/index.js";

describe("createStorageService", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "storage-test-"));

  test("upload and download roundtrip", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "test" });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      onError: "throw",
    });

    await storage.upload({
      bucket,
      path: "foo/bar.txt",
      data: Buffer.from("hello world"),
      options: { contentType: "text/plain" },
    });

    const downloaded = await storage.download({ bucket, path: "foo/bar.txt" });
    expect(downloaded.toString()).toBe("hello world");
  });

  test("upload with defaultBucket (no bucket in params)", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "default" });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      onError: "throw",
    });

    await storage.upload({
      path: "default-path.txt",
      data: "default content",
    });

    const downloaded = await storage.download({ path: "default-path.txt" });
    expect(downloaded.toString()).toBe("default content");
  });

  test("delete removes file", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "delete-test" });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      onError: "throw",
    });

    await storage.upload({
      path: "to-delete.txt",
      data: "delete me",
    });
    expect(await storage.exists({ path: "to-delete.txt" })).toBe(true);

    await storage.delete({ path: "to-delete.txt" });
    expect(await storage.exists({ path: "to-delete.txt" })).toBe(false);
  });

  test("exists returns true for existing file", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "exists" });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      onError: "throw",
    });

    await storage.upload({ path: "exists.txt", data: "x" });
    expect(await storage.exists({ path: "exists.txt" })).toBe(true);
  });

  test("exists returns false for missing file", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "exists" });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      onError: "throw",
    });

    expect(await storage.exists({ path: "missing.txt" })).toBe(false);
  });

  test("getUrl returns file URL for local", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "url" });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      onError: "throw",
    });

    await storage.upload({ path: "url.txt", data: "x" });
    const url = await storage.getUrl({ path: "url.txt" });
    expect(url).toMatch(/^file:\/\//);
    expect(url).toContain("url");
  });

  test("throws when bucket not in configured buckets", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "allowed" });
    const otherBucket = defineBucket({ source, name: "not-allowed" });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      onError: "throw",
    });

    await expect(
      storage.upload({
        bucket: otherBucket,
        path: "x.txt",
        data: "x",
      })
    ).rejects.toThrow("not in the configured buckets");
  });

  test("throws when no bucket and no defaultBucket", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "only" });
    const storage = createStorageService({
      buckets: [bucket],
      onError: "throw",
    });

    await expect(
      storage.upload({
        path: "x.txt",
        data: "x",
      })
    ).rejects.toThrow("No bucket specified");
  });

  test("onError silent returns fallback on download error", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "silent" });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      onError: "silent",
    });

    const result = await storage.download({ path: "nonexistent.txt" });
    expect(result).toEqual(Buffer.alloc(0));
  });

  test("onError silent returns false for exists on error", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "silent" });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      onError: "silent",
    });

    const result = await storage.exists({ path: "nonexistent.txt" });
    expect(result).toBe(false);
  });
});
