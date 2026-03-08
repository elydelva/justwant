import { describe, expect, test } from "bun:test";
/**
 * E2E integration tests — full storage flow with multiple sources, buckets, and plugins.
 */
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStorageService, defineBucket } from "./index.js";
import { defineLocalSource } from "./local/index.js";
import { encryptionPlugin } from "./plugins/encryption.js";
import { multiBucketPlugin } from "./plugins/multiBucket.js";
import { renamePlugin } from "./plugins/rename.js";
import { signedUrlPlugin } from "./plugins/signedUrl.js";
import { watermarkPlugin } from "./plugins/watermark.js";

describe("storage integration (full flow with plugins)", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "storage-e2e-"));

  test("full flow: upload → getUrl → getSignedUrl → download → delete with plugin chain", async () => {
    const source = defineLocalSource({ rootDir });
    const avatarsBucket = defineBucket({ source, name: "avatars" });
    const docsBucket = defineBucket({ source, name: "documents" });

    const storage = createStorageService({
      buckets: [avatarsBucket, docsBucket],
      defaultBucket: avatarsBucket,
      plugins: [
        signedUrlPlugin({ defaultExpiresIn: 3600 }),
        renamePlugin({ sanitize: true, strategy: "uuid" }),
        multiBucketPlugin({
          routing: { "image/*": avatarsBucket, "application/pdf": docsBucket },
          defaultBucket: avatarsBucket,
        }),
        encryptionPlugin({ key: "e2e-test-key-32-bytes-long!!!!" }),
      ],
      onError: "throw",
    });

    const imageData = Buffer.from("fake image content");
    const result = await storage.upload({
      path: "users/123/photo.jpg",
      data: imageData,
      options: { contentType: "image/jpeg" },
    });

    expect(result.path).toMatch(/^users\/123\/[0-9a-f-]{36}\.jpg$/);

    const url = await storage.getUrl({ path: result.path });
    expect(url).toMatch(/^file:\/\//);

    const signedUrl = await storage.getSignedUrl({
      path: result.path,
      options: { expiresIn: 900 },
    });
    expect(signedUrl).toMatch(/^file:\/\//);

    const downloaded = await storage.download({ path: result.path });
    expect(downloaded.toString()).toBe("fake image content");

    await storage.delete({ path: result.path });
    expect(await storage.exists({ path: result.path })).toBe(false);
  });

  test("multi-bucket routing: image vs PDF", async () => {
    const source = defineLocalSource({ rootDir });
    const imagesBucket = defineBucket({ source, name: "images" });
    const docsBucket = defineBucket({ source, name: "docs" });

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
      data: "image",
      options: { contentType: "image/jpeg" },
    });
    const imgData = await storage.download({ bucket: imagesBucket, path: "photo.jpg" });
    expect(imgData.toString()).toBe("image");

    await storage.upload({
      path: "report.pdf",
      data: "pdf content",
      options: { contentType: "application/pdf" },
    });
    const pdfData = await storage.download({ bucket: docsBucket, path: "report.pdf" });
    expect(pdfData.toString()).toBe("pdf content");
  });

  test("watermark + encryption: image URL transformation with encrypted storage", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "secure-images" });

    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      plugins: [
        encryptionPlugin({ key: "secure-e2e-key-32-bytes!!!!" }),
        watermarkPlugin({
          provider: "cloudflare",
          cloudflare: { fit: "cover", width: 800 },
        }),
      ],
      onError: "throw",
    });

    await storage.upload({
      path: "secure/avatar.png",
      data: "encrypted image",
      options: { contentType: "image/png" },
    });

    const url = await storage.getUrl({ path: "secure/avatar.png" });
    expect(url).toContain("fit=cover");
    expect(url).toContain("width=800");

    const decrypted = await storage.download({ path: "secure/avatar.png" });
    expect(decrypted.toString()).toBe("encrypted image");
  });
});
