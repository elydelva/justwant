import { describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStorageService } from "../createStorageService.js";
import { defineBucket } from "../defineBucket.js";
import { defineLocalSource } from "../local/index.js";
import { encryptionPlugin } from "./encryption.js";

describe("encryptionPlugin", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "encryption-test-"));
  const key = "test-secret-key-32-bytes-long!!!!";

  test("encrypt and decrypt roundtrip", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "enc" });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      plugins: [encryptionPlugin({ key })],
      onError: "throw",
    });

    const plaintext = "sensitive data";
    await storage.upload({
      path: "secret.txt",
      data: plaintext,
    });

    const downloaded = await storage.download({ path: "secret.txt" });
    expect(downloaded.toString()).toBe(plaintext);
  });
});
