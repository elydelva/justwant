/**
 * Plugin imageTransform - resize, format, quality via sharp.
 *
 * Peer dep: sharp
 */

import { createRequire } from "node:module";
import type { StoragePlugin, StorageUploadNext, UploadParams } from "../types.js";

const require = createRequire(import.meta.url);

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
]);

function isImageContentType(contentType: string | undefined): boolean {
  if (!contentType) return false;
  const part = contentType.split(";")[0];
  const base = part?.trim().toLowerCase() ?? "";
  return IMAGE_TYPES.has(base) || base.startsWith("image/");
}

async function toBuffer(
  data: Buffer | Blob | ReadableStream<Uint8Array> | string
): Promise<Buffer> {
  if (typeof data === "string") return Buffer.from(data, "utf-8");
  if (data instanceof Buffer) return data;
  if (data instanceof Blob) return Buffer.from(await data.arrayBuffer());
  const chunks: Uint8Array[] = [];
  const reader = (data as ReadableStream<Uint8Array>).getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export interface ImageTransformPluginOptions {
  maxWidth?: number;
  maxHeight?: number;
  format?: "webp" | "avif" | "jpeg" | "png";
  quality?: number;
}

export function imageTransformPlugin(options?: ImageTransformPluginOptions): StoragePlugin {
  const { maxWidth, maxHeight, format, quality = 80 } = options ?? {};

  return {
    name: "imageTransform",

    async upload(params: UploadParams, next: StorageUploadNext) {
      const contentType = params.options?.contentType;
      if (!isImageContentType(contentType)) {
        return next(params);
      }

      type SharpChain = {
        resize: (w?: number, h?: number, o?: object) => SharpChain;
        webp: (o?: object) => SharpChain;
        avif: (o?: object) => SharpChain;
        jpeg: (o?: object) => SharpChain;
        png: (o?: object) => SharpChain;
        toBuffer: () => Promise<Buffer>;
      };

      let sharp: (i: Buffer) => SharpChain;
      try {
        const sharpModule = require("sharp") as unknown;
        const fn =
          typeof sharpModule === "function"
            ? sharpModule
            : (sharpModule as { default?: (i: Buffer) => SharpChain }).default;
        if (!fn) return next(params);
        sharp = fn as (i: Buffer) => SharpChain;
      } catch {
        return next(params);
      }

      const input = await toBuffer(params.data);
      let instance: SharpChain = sharp(input);

      if (maxWidth ?? maxHeight) {
        instance = instance.resize(maxWidth, maxHeight, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      const formatOpts = { quality };
      if (format === "webp") {
        instance = instance.webp(formatOpts);
      } else if (format === "avif") {
        instance = instance.avif(formatOpts);
      } else if (format === "jpeg") {
        instance = instance.jpeg(formatOpts);
      } else if (format === "png") {
        instance = instance.png(formatOpts);
      }

      const output = await instance.toBuffer();

      const ext = format ? `.${format}` : (params.path.match(/\.[^.]+$/) ?? [""])[0];
      const basePath = params.path.replace(/\.[^.]+$/, "");
      const newPath = `${basePath}${ext}`;

      const newContentType =
        format === "webp"
          ? "image/webp"
          : format === "avif"
            ? "image/avif"
            : format === "jpeg"
              ? "image/jpeg"
              : format === "png"
                ? "image/png"
                : params.options?.contentType;

      return next({
        ...params,
        path: newPath,
        data: output,
        options: {
          ...params.options,
          contentType: newContentType,
        },
      });
    },
  };
}
