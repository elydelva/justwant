/**
 * Local filesystem storage source.
 */

import { existsSync, mkdirSync } from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
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

export interface DefineLocalSourceConfig {
  rootDir: string;
}

function normalizePath(p: string): string {
  const normalized = p.replaceAll("\\", "/").replace(/\/+/g, "/");
  if (normalized.includes("..")) {
    throw new Error("Path must not contain '..'");
  }
  return normalized.startsWith("/") ? normalized.slice(1) : normalized;
}

function getFullPath(bucketName: string, path: string, rootDir: string): string {
  const safePath = normalizePath(path);
  return join(rootDir, bucketName, safePath);
}

function createLocalAdapter(rootDir: string): StorageSourceAdapter {
  return {
    async upload(params: AdapterUploadParams): Promise<{ path: string; size?: number }> {
      const fullPath = getFullPath(params.bucket.name, params.path, rootDir);
      const dir = dirname(fullPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      let data: Buffer;
      if (typeof params.data === "string") {
        data = Buffer.from(params.data, "utf-8");
      } else if (params.data instanceof Buffer) {
        data = params.data;
      } else if (params.data instanceof Blob) {
        data = Buffer.from(await params.data.arrayBuffer());
      } else {
        const stream = params.data as ReadableStream<Uint8Array>;
        const chunks: Uint8Array[] = [];
        const reader = stream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
        data = Buffer.concat(chunks);
      }

      await writeFile(fullPath, data);
      return { path: params.path, size: data.length };
    },

    async download(params: AdapterDownloadParams): Promise<Buffer> {
      const fullPath = getFullPath(params.bucket.name, params.path, rootDir);
      return readFile(fullPath);
    },

    async delete(params: AdapterDeleteParams): Promise<void> {
      const fullPath = getFullPath(params.bucket.name, params.path, rootDir);
      await unlink(fullPath);
    },

    async getUrl(params: AdapterGetUrlParams): Promise<string> {
      const fullPath = getFullPath(params.bucket.name, params.path, rootDir);
      return `file://${fullPath}`;
    },

    async getSignedUrl(params: AdapterGetSignedUrlParams): Promise<string> {
      return this.getUrl(params);
    },

    async exists(params: AdapterExistsParams): Promise<boolean> {
      const fullPath = getFullPath(params.bucket.name, params.path, rootDir);
      return existsSync(fullPath);
    },
  };
}

export function defineLocalSource(config: DefineLocalSourceConfig): StorageSource {
  const { rootDir } = config;
  const resolvedRoot = join(process.cwd(), rootDir);
  const adapter = createLocalAdapter(resolvedRoot);

  return {
    _type: "local",
    _adapter: adapter,
  };
}
