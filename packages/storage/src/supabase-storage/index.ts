/**
 * Supabase Storage source.
 *
 * Peer dep: @supabase/supabase-js
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

export interface DefineSupabaseStorageSourceConfig {
  url: string;
  key: string;
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

export function defineSupabaseStorageSource(
  config: DefineSupabaseStorageSourceConfig
): StorageSource {
  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(config.url, config.key);

  const adapter: StorageSourceAdapter = {
    async upload(params: AdapterUploadParams): Promise<{ path: string; url?: string }> {
      const buffer = await toBuffer(params.data);
      const { data, error } = await supabase.storage
        .from(params.bucket.name)
        .upload(params.path, buffer, {
          contentType: params.options?.contentType,
          upsert: true,
        });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from(params.bucket.name).getPublicUrl(params.path);
      return {
        path: params.path,
        url: urlData?.publicUrl ?? data?.path,
      };
    },

    async download(params: AdapterDownloadParams): Promise<Buffer> {
      const { data, error } = await supabase.storage.from(params.bucket.name).download(params.path);
      if (error) throw error;
      if (!data) return Buffer.alloc(0);
      return Buffer.from(await data.arrayBuffer());
    },

    async delete(params: AdapterDeleteParams): Promise<void> {
      const { error } = await supabase.storage.from(params.bucket.name).remove([params.path]);
      if (error) throw error;
    },

    async getUrl(params: AdapterGetUrlParams): Promise<string> {
      const { data } = supabase.storage.from(params.bucket.name).getPublicUrl(params.path);
      return data.publicUrl;
    },

    async getSignedUrl(params: AdapterGetSignedUrlParams): Promise<string> {
      const expiresIn = params.options?.expiresIn ?? 3600;
      const { data, error } = await supabase.storage
        .from(params.bucket.name)
        .createSignedUrl(params.path, expiresIn);
      if (error) throw error;
      return data?.signedUrl ?? "";
    },

    async exists(params: AdapterExistsParams): Promise<boolean> {
      try {
        const { error } = await supabase.storage.from(params.bucket.name).download(params.path);
        return !error;
      } catch {
        return false;
      }
    },
  };

  return {
    _type: "supabase",
    _adapter: adapter,
  };
}
