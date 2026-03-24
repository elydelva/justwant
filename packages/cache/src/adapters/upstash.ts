import { parseTtl } from "../ttl.js";
import type { CacheAdapter, SetOptions } from "../types.js";

function parseTtlOptions(ttl: SetOptions["ttl"]): { ex?: number; exat?: number } | undefined {
  const parsed = parseTtl(ttl);
  if (parsed === undefined) return undefined;
  if (typeof parsed === "number") return { ex: Math.ceil(parsed / 1000) };
  return { exat: Math.ceil(parsed.getTime() / 1000) };
}

export interface UpstashRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { ex?: number; exat?: number }): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  exists(key: string): Promise<number>;
  mget<T = string>(...keys: string[]): Promise<(T | null)[]>;
  mset(obj: Record<string, string>): Promise<unknown>;
  expire(key: string, seconds: number): Promise<unknown>;
  ttl(key: string): Promise<number>;
  sadd?(key: string, ...members: string[]): Promise<number>;
  smembers?(key: string): Promise<string[]>;
  srem?(key: string, ...members: string[]): Promise<number>;
}

export interface UpstashAdapterOptions {
  redis: UpstashRedisClient;
  keyPrefix?: string;
  tagPrefix?: string;
}

function prefix(key: string, p: string) {
  return p ? `${p}${key}` : key;
}

export function upstashAdapter(options: UpstashAdapterOptions): CacheAdapter {
  const { redis, keyPrefix = "", tagPrefix = "tag:" } = options;

  function tagSetKey(tag: string) {
    return `${tagPrefix}${tag}`;
  }

  return {
    async get(key: string): Promise<string | null> {
      const k = prefix(key, keyPrefix);
      return redis.get(k);
    },

    async set(key: string, value: string, opts?: SetOptions): Promise<void> {
      const k = prefix(key, keyPrefix);
      const ttlOpts = opts?.ttl !== undefined ? parseTtlOptions(opts.ttl) : undefined;
      await redis.set(k, value, ttlOpts);

      if (opts?.tags?.length && redis.sadd) {
        for (const tag of opts.tags) {
          await redis.sadd(tagSetKey(tag), k);
        }
      }
    },

    async delete(key: string): Promise<void> {
      const k = prefix(key, keyPrefix);
      await redis.del(k);
    },

    async has(key: string): Promise<boolean> {
      const k = prefix(key, keyPrefix);
      return (await redis.exists(k)) === 1;
    },

    async getMany(keys: string[]): Promise<Map<string, string | null>> {
      const prefixed = keys.map((k) => prefix(k, keyPrefix));
      const vals = await redis.mget(...prefixed);
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
      for (const e of entries) obj[prefix(e.key, keyPrefix)] = e.value;
      await redis.mset(obj);
      for (const e of entries) {
        const k = prefix(e.key, keyPrefix);
        if (e.opts?.ttl) {
          const ttlOpts = parseTtlOptions(e.opts.ttl);
          const ex = ttlOpts?.ex ?? (ttlOpts?.exat ? ttlOpts.exat - Math.ceil(Date.now() / 1000) : undefined);
          if (ex !== undefined && ex > 0) await redis.expire(k, ex);
        }
        if (e.opts?.tags?.length && redis.sadd) {
          for (const tag of e.opts.tags) await redis.sadd(tagSetKey(tag), k);
        }
      }
    },

    async deleteMany(keys: string[]): Promise<void> {
      if (keys.length === 0) return;
      const prefixed = keys.map((k) => prefix(k, keyPrefix));
      await redis.del(...prefixed);
    },

    async ttl(key: string): Promise<number | null | -1> {
      const k = prefix(key, keyPrefix);
      const t = await redis.ttl(k);
      if (t === -2) return -1;
      if (t === -1) return null;
      return t * 1000;
    },

    async expire(key: string, ttl: import("../types.js").TTL): Promise<void> {
      const ttlOpts = parseTtlOptions(ttl);
      const ttlSec = ttlOpts?.ex ?? (ttlOpts?.exat ? ttlOpts.exat - Math.ceil(Date.now() / 1000) : undefined);
      if (ttlSec !== undefined && ttlSec > 0) await redis.expire(prefix(key, keyPrefix), ttlSec);
    },

    async invalidateTag(tag: string): Promise<void> {
      if (!redis.smembers || !redis.srem) return;
      const setKey = tagSetKey(tag);
      const keys = await redis.smembers(setKey);
      if (keys.length > 0) {
        await redis.del(...keys);
        await redis.del(setKey);
      }
    },

    async invalidateTags(tags: string[]): Promise<void> {
      for (const tag of tags) {
        await this.invalidateTag?.(tag);
      }
    },

    async getTagKeys(tag: string): Promise<string[]> {
      if (!redis.smembers) return [];
      const keys = await redis.smembers(tagSetKey(tag));
      return keyPrefix ? keys.map((k) => k.slice(keyPrefix.length)) : keys;
    },
  };
}
