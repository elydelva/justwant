import { parseTtl } from "../ttl.js";
import type { CacheAdapter, SetOptions } from "../types.js";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const TTL_PREFIX = "__ttl:";
const TAGS_PREFIX = "__tags:";
const TAG_INDEX_PREFIX = "__tagidx:";

function ttlKey(k: string) {
  return `${TTL_PREFIX}${k}`;
}

function tagsKey(k: string) {
  return `${TAGS_PREFIX}${k}`;
}

function tagIndexKey(tag: string) {
  return `${TAG_INDEX_PREFIX}${tag}`;
}

function getTagKeys(storage: StorageLike, tag: string): string[] {
  const raw = storage.getItem(tagIndexKey(tag));
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as string[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function addKeyToTag(storage: StorageLike, tag: string, key: string) {
  const keys = new Set(getTagKeys(storage, tag));
  keys.add(key);
  storage.setItem(tagIndexKey(tag), JSON.stringify(Array.from(keys)));
}

function removeKeyFromTag(storage: StorageLike, tag: string, key: string) {
  const keys = getTagKeys(storage, tag).filter((k) => k !== key);
  if (keys.length === 0) {
    storage.removeItem(tagIndexKey(tag));
  } else {
    storage.setItem(tagIndexKey(tag), JSON.stringify(keys));
  }
}

export function storageAdapter(storage: StorageLike): CacheAdapter {
  const self = {
    async get(key: string): Promise<string | null> {
      const ttlRaw = storage.getItem(ttlKey(key));
      if (ttlRaw) {
        const expiresAt = Number.parseInt(ttlRaw, 10);
        if (Number.isFinite(expiresAt) && Date.now() > expiresAt) {
          const tagsRaw = storage.getItem(tagsKey(key));
          if (tagsRaw) {
            try {
              const tags = JSON.parse(tagsRaw) as string[];
              for (const t of tags) removeKeyFromTag(storage, t, key);
            } catch {
              /* ignore */
            }
          }
          storage.removeItem(key);
          storage.removeItem(ttlKey(key));
          storage.removeItem(tagsKey(key));
          return null;
        }
      }
      return storage.getItem(key);
    },

    async set(key: string, value: string, opts?: SetOptions): Promise<void> {
      const tagsRaw = storage.getItem(tagsKey(key));
      if (tagsRaw) {
        try {
          const prevTags = JSON.parse(tagsRaw) as string[];
          for (const t of prevTags) removeKeyFromTag(storage, t, key);
        } catch {
          /* ignore */
        }
      }

      storage.setItem(key, value);
      const parsed = parseTtl(opts?.ttl);
      if (parsed === undefined) {
        storage.removeItem(ttlKey(key));
      } else {
        const expiresAt = typeof parsed === "number" ? Date.now() + parsed : parsed.getTime();
        storage.setItem(ttlKey(key), String(expiresAt));
      }
      if (opts?.tags?.length) {
        storage.setItem(tagsKey(key), JSON.stringify(opts.tags));
        for (const t of opts.tags) addKeyToTag(storage, t, key);
      } else {
        storage.removeItem(tagsKey(key));
      }
    },

    async delete(key: string): Promise<void> {
      const tagsRaw = storage.getItem(tagsKey(key));
      if (tagsRaw) {
        try {
          const tags = JSON.parse(tagsRaw) as string[];
          for (const t of tags) removeKeyFromTag(storage, t, key);
        } catch {
          /* ignore */
        }
      }
      storage.removeItem(key);
      storage.removeItem(ttlKey(key));
      storage.removeItem(tagsKey(key));
    },

    async has(key: string): Promise<boolean> {
      const val = await self.get(key);
      return val !== null;
    },

    async getMany(keys: string[]): Promise<Map<string, string | null>> {
      const result = new Map<string, string | null>();
      for (const k of keys) {
        result.set(k, await self.get(k));
      }
      return result;
    },

    async setMany(
      entries: Array<{ key: string; value: string; opts?: SetOptions }>
    ): Promise<void> {
      for (const e of entries) {
        await self.set(e.key, e.value, e.opts);
      }
    },

    async deleteMany(keys: string[]): Promise<void> {
      for (const k of keys) {
        await self.delete(k);
      }
    },

    async invalidateTag(tag: string): Promise<void> {
      const keys = getTagKeys(storage, tag);
      for (const k of keys) {
        await self.delete(k);
      }
    },

    async invalidateTags(tags: string[]): Promise<void> {
      for (const tag of tags) {
        await self.invalidateTag(tag);
      }
    },

    async getTagKeys(tag: string): Promise<string[]> {
      return getTagKeys(storage, tag);
    },
  };

  return self;
}
