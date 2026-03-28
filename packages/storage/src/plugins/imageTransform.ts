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

type SharpChain = {
  resize: (w?: number, h?: number, o?: object) => SharpChain;
  webp: (o?: object) => SharpChain;
  avif: (o?: object) => SharpChain;
  jpeg: (o?: object) => SharpChain;
  png: (o?: object) => SharpChain;
  toBuffer: () => Promise<Buffer>;
};

function loadSharp(): ((i: Buffer) => SharpChain) | null {
  try {
    const mod = require("sharp") as unknown;
    const fn =
      typeof mod === "function" ? mod : (mod as { default?: (i: Buffer) => SharpChain }).default;
    return (fn as (i: Buffer) => SharpChain) ?? null;
  } catch {
    return null;
  }
}

function applyFormat(
  instance: SharpChain,
  format: ImageTransformPluginOptions["format"],
  quality: number
): SharpChain {
  const opts = { quality };
  if (format === "webp") return instance.webp(opts);
  if (format === "avif") return instance.avif(opts);
  if (format === "jpeg") return instance.jpeg(opts);
  if (format === "png") return instance.png(opts);
  return instance;
}

function resolveOutputContentType(
  format: ImageTransformPluginOptions["format"],
  fallback: string | undefined
): string | undefined {
  if (format === "webp") return "image/webp";
  if (format === "avif") return "image/avif";
  if (format === "jpeg") return "image/jpeg";
  if (format === "png") return "image/png";
  return fallback;
}

export function imageTransformPlugin(options?: ImageTransformPluginOptions): StoragePlugin {
  const { maxWidth, maxHeight, format, quality = 80 } = options ?? {};

  return {
    name: "imageTransform",

    async upload(params: UploadParams, next: StorageUploadNext) {
      if (!isImageContentType(params.options?.contentType)) return next(params);

      const sharp = loadSharp();
      if (!sharp) return next(params);

      const input = await toBuffer(params.data);
      let instance = sharp(input);

      if (maxWidth ?? maxHeight) {
        instance = instance.resize(maxWidth, maxHeight, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      instance = applyFormat(instance, format, quality);

      const output = await instance.toBuffer();
      const ext = format ? `.${format}` : (params.path.match(/\.[^.]+$/) ?? [""])[0];
      const newPath = `${params.path.replace(/\.[^.]+$/, "")}${ext}`;

      return next({
        ...params,
        path: newPath,
        data: output,
        options: {
          ...params.options,
          contentType: resolveOutputContentType(format, params.options?.contentType),
        },
      });
    },
  };
}
