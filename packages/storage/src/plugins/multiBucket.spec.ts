import { describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStorageService } from "../createStorageService.js";
import { defineBucket } from "../defineBucket.js";
import { defineLocalSource } from "../local/index.js";
import { multiBucketPlugin } from "./multiBucket.js";

describe("multiBucketPlugin", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "multibucket-test-"));
  const source = defineLocalSource({ rootDir });
  const imagesBucket = defineBucket({ source, name: "images" });
  const docsBucket = defineBucket({ source, name: "documents" });

  test("routes image/* to images bucket", async () => {
    const storage = createStorageService({
      buckets: [imagesBucket, docsBucket],
      plugins: [
        multiBucketPlugin({
          routing: { "image/*": imagesBucket, "application/pdf": docsBucket },
          defaultBucket: docsBucket,
        }),
      ],
      onError: "throw",
    });

    await storage.upload({
      path: "photo.jpg",
      data: Buffer.from("x"),
      options: { contentType: "image/jpeg" },
    });

    const downloaded = await storage.download({
      bucket: imagesBucket,
      path: "photo.jpg",
    });
    expect(downloaded.toString()).toBe("x");
  });

  test("routes application/pdf to documents bucket", async () => {
    const storage = createStorageService({
      buckets: [imagesBucket, docsBucket],
      plugins: [
        multiBucketPlugin({
          routing: { "image/*": imagesBucket, "application/pdf": docsBucket },
          defaultBucket: docsBucket,
        }),
      ],
      onError: "throw",
    });

    await storage.upload({
      path: "doc.pdf",
      data: Buffer.from("pdf"),
      options: { contentType: "application/pdf" },
    });

    const downloaded = await storage.download({
      bucket: docsBucket,
      path: "doc.pdf",
    });
    expect(downloaded.toString()).toBe("pdf");
  });

  test("uses defaultBucket when no match", async () => {
    const storage = createStorageService({
      buckets: [imagesBucket, docsBucket],
      plugins: [
        multiBucketPlugin({
          routing: { "image/*": imagesBucket },
          defaultBucket: docsBucket,
        }),
      ],
      onError: "throw",
    });

    await storage.upload({
      path: "unknown.txt",
      data: "text",
      options: { contentType: "text/plain" },
    });

    const downloaded = await storage.download({
      bucket: docsBucket,
      path: "unknown.txt",
    });
    expect(downloaded.toString()).toBe("text");
  });

  test("throws when no match and no defaultBucket", async () => {
    const storage = createStorageService({
      buckets: [imagesBucket],
      plugins: [
        multiBucketPlugin({
          routing: { "image/*": imagesBucket },
        }),
      ],
      onError: "throw",
    });

    await expect(
      storage.upload({
        path: "unknown.txt",
        data: "x",
        options: { contentType: "text/plain" },
      })
    ).rejects.toThrow("No bucket match");
  });
});
