import { parseTtl } from "../ttl.js";
import type { CacheAdapter, SetOptions } from "../types.js";

export interface VercelKVClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { ex?: number }): Promise<string>;
  del(...keys: string[]): Promise<number>;
  mget<T = string>(...keys: string[]): Promise<(T | null)[]>;
  mset(obj: Record<string, string>): Promise<string>;
}

export interface VercelKvAdapterOptions {
  kv: VercelKVClient;
  keyPrefix?: string;
}

function prefix(key: string, p: string) {
  return p ? `${p}${key}` : key;
}

export function vercelKvAdapter(options: VercelKvAdapterOptions): CacheAdapter {
  const { kv, keyPrefix = "" } = options;

  return {
    async get(key: string): Promise<string | null> {
      const k = prefix(key, keyPrefix);
      return kv.get(k);
    },

    async set(key: string, value: string, opts?: SetOptions): Promise<void> {
      const k = prefix(key, keyPrefix);
      const parsed = parseTtl(opts?.ttl);
      const options: { ex?: number } = {};
      if (parsed !== undefined) {
        options.ex =
          typeof parsed === "number"
            ? Math.ceil(parsed / 1000)
            : Math.ceil((parsed.getTime() - Date.now()) / 1000);
      }
      await kv.set(k, value, Object.keys(options).length ? options : undefined);
    },

    async delete(key: string): Promise<void> {
      const k = prefix(key, keyPrefix);
      await kv.del(k);
    },

    async has(key: string): Promise<boolean> {
      const val = await this.get?.(key);
      return val !== null;
    },

    async getMany(keys: string[]): Promise<Map<string, string | null>> {
      const prefixed = keys.map((k) => prefix(k, keyPrefix));
      const vals = await kv.mget(...prefixed);
      const result = new Map<string, string | null>();
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (k !== undefined) result.set(k, (vals[i] as string | null) ?? null);
      }
      return result;
    },

    async setMany(
      entries: Array<{ key: string; value: string; opts?: SetOptions }>
    ): Promise<void> {
      const obj: Record<string, string> = {};
      for (const e of entries) {
        obj[prefix(e.key, keyPrefix)] = e.value;
      }
      await kv.mset(obj);
    },

    async deleteMany(keys: string[]): Promise<void> {
      if (keys.length === 0) return;
      const prefixed = keys.map((k) => prefix(k, keyPrefix));
      await kv.del(...prefixed);
    },
  };
}
