import { describe, expect, test } from "bun:test";
import type { UploadParams } from "../types.js";
import { imageTransformPlugin } from "./imageTransform.js";

function makeParams(overrides: Partial<UploadParams> = {}): UploadParams {
  return {
    path: "photo.jpg",
    data: Buffer.from("fake"),
    options: { contentType: "image/jpeg" },
    ...overrides,
  };
}

describe("imageTransformPlugin", () => {
  test("plugin name is imageTransform", () => {
    const plugin = imageTransformPlugin();
    expect(plugin.name).toBe("imageTransform");
  });

  test("passes through when contentType is not an image (PDF)", async () => {
    const plugin = imageTransformPlugin({ format: "webp" });
    let receivedParams: UploadParams | undefined;
    await plugin.upload?.(
      makeParams({ options: { contentType: "application/pdf" } }),
      async (p) => {
        receivedParams = p;
      }
    );
    expect(receivedParams?.options?.contentType).toBe("application/pdf");
  });

  test("passes through when contentType is absent", async () => {
    const plugin = imageTransformPlugin({ format: "webp" });
    let called = false;
    await plugin.upload?.(makeParams({ options: {} }), async () => {
      called = true;
    });
    expect(called).toBe(true);
  });

  test("passes through when contentType is text/plain", async () => {
    const plugin = imageTransformPlugin({ format: "webp" });
    let called = false;
    await plugin.upload?.(makeParams({ options: { contentType: "text/plain" } }), async () => {
      called = true;
    });
    expect(called).toBe(true);
  });

  test("passes through when options are undefined", async () => {
    const plugin = imageTransformPlugin();
    let called = false;
    await plugin.upload?.({ path: "file.bin", data: Buffer.from("x") }, async () => {
      called = true;
    });
    expect(called).toBe(true);
  });

  test("calls next for video/* content type (not an image)", async () => {
    const plugin = imageTransformPlugin({ maxWidth: 800 });
    let called = false;
    await plugin.upload?.(makeParams({ options: { contentType: "video/mp4" } }), async () => {
      called = true;
    });
    expect(called).toBe(true);
  });
});
