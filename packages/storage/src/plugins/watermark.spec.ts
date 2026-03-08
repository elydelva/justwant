import { describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStorageService } from "../createStorageService.js";
import { defineBucket } from "../defineBucket.js";
import { defineLocalSource } from "../local/index.js";
import { watermarkPlugin } from "./watermark.js";

describe("watermarkPlugin", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "watermark-test-"));

  test("adds cloudflare params to image URL", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "img" });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      plugins: [
        watermarkPlugin({
          provider: "cloudflare",
          cloudflare: { fit: "cover", width: 800 },
        }),
      ],
      onError: "throw",
    });

    await storage.upload({ path: "photo.jpg", data: "x" });
    const url = await storage.getUrl({ path: "photo.jpg" });
    expect(url).toContain("fit=cover");
    expect(url).toContain("width=800");
  });

  test("passes through non-image URL unchanged", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "files" });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      plugins: [
        watermarkPlugin({
          provider: "cloudflare",
          cloudflare: { width: 800 },
        }),
      ],
      onError: "throw",
    });

    await storage.upload({ path: "doc.pdf", data: "x" });
    const url = await storage.getUrl({ path: "doc.pdf" });
    expect(url).toMatch(/^file:\/\//);
    expect(url).not.toContain("width");
  });

  test("adds imgproxy params to image URL", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "imgproxy" });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      plugins: [
        watermarkPlugin({
          provider: "imgproxy",
          imgproxy: { w: 400, h: 300 },
        }),
      ],
      onError: "throw",
    });

    await storage.upload({ path: "thumb.png", data: "x" });
    const url = await storage.getUrl({ path: "thumb.png" });
    expect(url).toContain("w:400");
    expect(url).toContain("h:300");
  });

  test("adds quality to cloudflare params", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "q" });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      plugins: [
        watermarkPlugin({
          provider: "cloudflare",
          cloudflare: { quality: 85 },
        }),
      ],
      onError: "throw",
    });

    await storage.upload({ path: "a.webp", data: "x" });
    const url = await storage.getUrl({ path: "a.webp" });
    expect(url).toContain("quality=85");
  });
});
