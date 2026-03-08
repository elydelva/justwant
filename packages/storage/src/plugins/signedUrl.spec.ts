import { describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStorageService } from "../createStorageService.js";
import { defineBucket } from "../defineBucket.js";
import { defineLocalSource } from "../local/index.js";
import { signedUrlPlugin } from "./signedUrl.js";

describe("signedUrlPlugin", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "signedurl-test-"));

  test("passes through getSignedUrl", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "test" });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      plugins: [signedUrlPlugin({ defaultExpiresIn: 3600 })],
      onError: "throw",
    });

    await storage.upload({ path: "file.txt", data: "hello" });
    const url = await storage.getSignedUrl({ path: "file.txt" });
    expect(url).toMatch(/^file:\/\//);
  });
});
