import type { CacheAdapter, SetOptions } from "../types.js";

export interface TieredAdapterOptions {
  /** L1: fast (e.g. memory), checked first */
  l1: CacheAdapter;
  /** L2: slower (e.g. redis), fallback and write-through */
  l2: CacheAdapter;
}

/**
 * Tiered cache: L1 (fast) + L2 (slower).
 * Read: L1 first, on miss read L2 and populate L1.
 * Write: both L1 and L2.
 * Delete: both L1 and L2.
 */
export function tieredAdapter(options: TieredAdapterOptions): CacheAdapter {
  const { l1, l2 } = options;

  return {
    async get(key: string): Promise<string | null> {
      const v1 = await l1.get(key);
      if (v1 !== null) return v1;
      const v2 = await l2.get(key);
      if (v2 !== null) {
        await l1.set(key, v2);
        return v2;
      }
      return null;
    },

    async set(key: string, value: string, opts?: SetOptions): Promise<void> {
      await Promise.all([l1.set(key, value, opts), l2.set(key, value, opts)]);
    },

    async delete(key: string): Promise<void> {
      await Promise.all([l1.delete(key), l2.delete(key)]);
    },

    async has(key: string): Promise<boolean> {
      const h1 = await l1.has(key);
      if (h1) return true;
      return l2.has(key);
    },

    async getMany(keys: string[]): Promise<Map<string, string | null>> {
      const result = new Map<string, string | null>();
      const fromL1 = l1.getMany ? await l1.getMany(keys) : null;
      const missing: string[] = [];
      if (fromL1) {
        for (const k of keys) {
          const v = fromL1.get(k);
          result.set(k, v ?? null);
          if (v === null || v === undefined) missing.push(k);
        }
      } else {
        for (const k of keys) {
          const v = await l1.get(k);
          result.set(k, v);
          if (v === null) missing.push(k);
        }
      }
      if (missing.length > 0 && l2.getMany) {
        const fromL2 = await l2.getMany(missing);
        for (const k of missing) {
          const v = fromL2.get(k) ?? null;
          result.set(k, v);
          if (v !== null) await l1.set(k, v);
        }
      } else if (missing.length > 0) {
        for (const k of missing) {
          const v = await l2.get(k);
          result.set(k, v);
          if (v !== null) await l1.set(k, v);
        }
      }
      return result;
    },

    async setMany(
      entries: Array<{ key: string; value: string; opts?: SetOptions }>
    ): Promise<void> {
      await Promise.all([
        l1.setMany?.(entries) ?? Promise.all(entries.map((e) => l1.set(e.key, e.value, e.opts))),
        l2.setMany?.(entries) ?? Promise.all(entries.map((e) => l2.set(e.key, e.value, e.opts))),
      ]);
    },

    async deleteMany(keys: string[]): Promise<void> {
      await Promise.all([
        l1.deleteMany?.(keys) ?? Promise.all(keys.map((k) => l1.delete(k))),
        l2.deleteMany?.(keys) ?? Promise.all(keys.map((k) => l2.delete(k))),
      ]);
    },

    async ttl(key: string): Promise<number | null | -1> {
      if (l1.ttl) return l1.ttl(key);
      return l2.ttl?.(key) ?? -1;
    },

    async expire(key: string, ttl: import("../types.js").TTL): Promise<void> {
      await Promise.all([l1.expire?.(key, ttl), l2.expire?.(key, ttl)]);
    },

    async persist(key: string): Promise<void> {
      await Promise.all([l1.persist?.(key), l2.persist?.(key)]);
    },

    async invalidateTag(tag: string): Promise<void> {
      await Promise.all([l1.invalidateTag?.(tag), l2.invalidateTag?.(tag)]);
    },

    async invalidateTags(tags: string[]): Promise<void> {
      await Promise.all([l1.invalidateTags?.(tags), l2.invalidateTags?.(tags)]);
    },

    async getTagKeys(tag: string): Promise<string[]> {
      return l1.getTagKeys?.(tag) ?? l2.getTagKeys?.(tag) ?? [];
    },
  };
}
