import { describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineBucket } from "./defineBucket.js";
import { defineLocalSource } from "./local/index.js";

describe("defineBucket", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "bucket-test-"));

  test("creates bucket with source and name", () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "my-bucket" });

    expect(bucket.source).toBe(source);
    expect(bucket.name).toBe("my-bucket");
    expect(bucket._adapter).toBe(source._adapter);
  });
});
