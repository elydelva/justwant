import { parseTtl } from "../ttl.js";
import type { CacheAdapter, SetOptions } from "../types.js";

export interface CloudflareKVNamespace {
  get(key: string, options?: { type?: "text" | "json" }): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expiration?: number; expirationTtl?: number }
  ): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ keys: { name: string }[] }>;
}

export interface CfKvAdapterOptions {
  kv: CloudflareKVNamespace;
  keyPrefix?: string;
}

function prefix(key: string, p: string) {
  return p ? `${p}${key}` : key;
}

export function cfKvAdapter(options: CfKvAdapterOptions): CacheAdapter {
  const { kv, keyPrefix = "" } = options;

  return {
    async get(key: string): Promise<string | null> {
      const k = prefix(key, keyPrefix);
      return kv.get(k);
    },

    async set(key: string, value: string, opts?: SetOptions): Promise<void> {
      const k = prefix(key, keyPrefix);
      const parsed = parseTtl(opts?.ttl);
      const options: { expiration?: number; expirationTtl?: number } = {};
      if (parsed !== undefined) {
        if (typeof parsed === "number") {
          options.expirationTtl = Math.ceil(parsed / 1000);
        } else {
          options.expiration = Math.ceil(parsed.getTime() / 1000);
        }
      }
      await kv.put(k, value, Object.keys(options).length ? options : undefined);
    },

    async delete(key: string): Promise<void> {
      const k = prefix(key, keyPrefix);
      await kv.delete(k);
    },

    async has(key: string): Promise<boolean> {
      const val = await this.get?.(key);
      return val !== null;
    },

    async getMany(keys: string[]): Promise<Map<string, string | null>> {
      const result = new Map<string, string | null>();
      for (const k of keys) {
        result.set(k, await this.get?.(k));
      }
      return result;
    },

    async setMany(
      entries: Array<{ key: string; value: string; opts?: SetOptions }>
    ): Promise<void> {
      for (const e of entries) {
        await this.set?.(e.key, e.value, e.opts);
      }
    },

    async deleteMany(keys: string[]): Promise<void> {
      for (const k of keys) {
        await this.delete?.(k);
      }
    },
  };
}
