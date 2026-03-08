/**
 * Vercel Blob storage source.
 *
 * Peer dep: @vercel/blob
 */

import { createRequire } from "node:module";
import type {
  AdapterDeleteParams,
  AdapterDownloadParams,
  AdapterExistsParams,
  AdapterGetSignedUrlParams,
  AdapterGetUrlParams,
  AdapterUploadParams,
  StorageSource,
  StorageSourceAdapter,
} from "../types.js";

const require = createRequire(import.meta.url);

export interface DefineVercelBlobSourceConfig {
  token?: string;
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

function getBlobBaseUrl(): string | undefined {
  return process.env.VERCEL_BLOB_API_URL ?? process.env.NEXT_PUBLIC_VERCEL_BLOB_API_URL;
}

export function defineVercelBlobSource(config: DefineVercelBlobSourceConfig): StorageSource {
  const blob = require("@vercel/blob");
  const { put, head, del } = blob;
  const hasGet = typeof blob.get === "function";
  const token = config.token ?? process.env.BLOB_READ_WRITE_TOKEN;
  const baseUrl = getBlobBaseUrl();

  const pathname = (bucket: string, path: string) => `${bucket}/${path}`;
  const blobUrl = (pathname: string) =>
    baseUrl ? `${baseUrl.replace(/\/$/, "")}/${pathname}` : "";

  const adapter: StorageSourceAdapter = {
    async upload(
      params: AdapterUploadParams
    ): Promise<{ path: string; url?: string; size?: number }> {
      const buffer = await toBuffer(params.data);
      const p = pathname(params.bucket.name, params.path);
      const result = await put(p, buffer, {
        access: "public",
        contentType: params.options?.contentType,
        addRandomSuffix: false,
        token,
      });
      const url = result?.url ?? blobUrl(p);
      return {
        path: params.path,
        url: typeof url === "string" ? url : (url as { href?: string })?.href,
        size: buffer.length,
      };
    },

    async download(params: AdapterDownloadParams): Promise<Buffer> {
      const p = pathname(params.bucket.name, params.path);
      if (baseUrl) {
        const url = blobUrl(p);
        const res = await fetch(url);
        if (!res.ok) return Buffer.alloc(0);
        return Buffer.from(await res.arrayBuffer());
      }
      if (hasGet) {
        const result = await blob.get(p, { token, access: "public" });
        if (!result?.stream) return Buffer.alloc(0);
        const chunks: Uint8Array[] = [];
        for await (const chunk of result.stream) chunks.push(chunk);
        return Buffer.concat(chunks);
      }
      const meta = await head(p, { token });
      if (!meta?.downloadUrl) return Buffer.alloc(0);
      const res = await fetch(meta.downloadUrl);
      if (!res.ok) return Buffer.alloc(0);
      return Buffer.from(await res.arrayBuffer());
    },

    async delete(params: AdapterDeleteParams): Promise<void> {
      const p = pathname(params.bucket.name, params.path);
      await del(baseUrl ? blobUrl(p) : p, { token });
    },

    async getUrl(params: AdapterGetUrlParams): Promise<string> {
      const p = pathname(params.bucket.name, params.path);
      if (baseUrl) return blobUrl(p);
      const meta = await head(baseUrl ? blobUrl(p) : p, { token });
      return meta?.url ?? meta?.downloadUrl ?? "";
    },

    async getSignedUrl(params: AdapterGetSignedUrlParams): Promise<string> {
      return this.getUrl(params);
    },

    async exists(params: AdapterExistsParams): Promise<boolean> {
      try {
        const p = pathname(params.bucket.name, params.path);
        if (baseUrl) {
          const res = await fetch(blobUrl(p), { method: "HEAD" });
          return res.ok;
        }
        const meta = await head(p, { token });
        return meta != null;
      } catch {
        return false;
      }
    },
  };

  return {
    _type: "vercel-blob",
    _adapter: adapter,
  };
}
