import { describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineBucket } from "../defineBucket.js";
import { defineLocalSource } from "./index.js";

describe("defineLocalSource", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "local-source-test-"));

  test("upload with Blob", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "blob" });
    const blob = new Blob(["blob content"], { type: "text/plain" });

    const result = await source._adapter.upload({
      bucket,
      path: "blob.txt",
      data: blob,
    });

    expect(result.path).toBe("blob.txt");
    const downloaded = await source._adapter.download({ bucket, path: "blob.txt" });
    expect(downloaded.toString()).toBe("blob content");
  });

  test("upload with ReadableStream", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "stream" });
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("stream "));
        controller.enqueue(new TextEncoder().encode("data"));
        controller.close();
      },
    });

    await source._adapter.upload({
      bucket,
      path: "stream.txt",
      data: stream,
    });

    const downloaded = await source._adapter.download({ bucket, path: "stream.txt" });
    expect(downloaded.toString()).toBe("stream data");
  });

  test("rejects path with ..", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "test" });

    await expect(
      source._adapter.upload({
        bucket,
        path: "foo/../bar.txt",
        data: "x",
      })
    ).rejects.toThrow("must not contain");
  });
});
