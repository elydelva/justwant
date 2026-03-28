/**
 * Plugin rename - sanitize path and apply naming strategy.
 */

import { createHash } from "node:crypto";
import type { StoragePlugin, StorageUploadNext, UploadParams } from "../types.js";

export interface RenamePluginOptions {
  sanitize?: boolean;
  strategy?: "uuid" | "hash" | "slug";
}

function sanitizePath(path: string): string {
  return path
    .replaceAll(/[<>:"|?*]/g, "_")
    .replace(/\/+/g, "/")
    .replace(/^\/+|\/+$/g, "");
}

function getExtension(path: string): string {
  const lastDot = path.lastIndexOf(".");
  if (lastDot === -1) return "";
  return path.slice(lastDot);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

async function hashBuffer(
  data: Buffer | Blob | ReadableStream<Uint8Array> | string
): Promise<string> {
  const buf = await toBuffer(data);
  return createHash("sha256").update(buf).digest("hex").slice(0, 16);
}

export function renamePlugin(options?: RenamePluginOptions): StoragePlugin {
  const { sanitize = true, strategy } = options ?? {};

  return {
    name: "rename",

    async upload(params: UploadParams, next: StorageUploadNext) {
      let path = params.path;
      const ext = getExtension(path);
      const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/") + 1) : "";

      if (sanitize) {
        const namePart = path.includes("/") ? path.slice(path.lastIndexOf("/") + 1) : path;
        const base = namePart.slice(0, namePart.length - ext.length) || "file";
        path = dir + sanitizePath(base) + ext;
      }

      if (strategy === "uuid") {
        path = dir + crypto.randomUUID() + ext;
      } else if (strategy === "hash") {
        const hash = await hashBuffer(params.data);
        path = dir + hash + ext;
        const buffer = await toBuffer(params.data);
        return next({ ...params, path, data: buffer });
      } else if (strategy === "slug") {
        const namePart = path.includes("/") ? path.slice(path.lastIndexOf("/") + 1) : path;
        const base = namePart.slice(0, namePart.length - ext.length) || "file";
        path = dir + slugify(base) + ext;
      }

      return next({ ...params, path });
    },
  };
}
