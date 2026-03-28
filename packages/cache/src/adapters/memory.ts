import { parseTtl } from "../ttl.js";
import type { CacheAdapter, SetOptions } from "../types.js";

interface Entry {
  value: string;
  expiresAt: number | null;
  tags?: string[];
}

function createTagIndex() {
  const tagToKeys = new Map<string, Set<string>>();

  function addTag(key: string, tag: string) {
    let set = tagToKeys.get(tag);
    if (!set) {
      set = new Set();
      tagToKeys.set(tag, set);
    }
    set.add(key);
  }

  function removeTag(key: string, tag: string) {
    const set = tagToKeys.get(tag);
    if (set) set.delete(key);
  }

  function applyTags(key: string, tags: string[] | undefined) {
    if (!tags?.length) return;
    for (const tag of tags) addTag(key, tag);
  }

  return { tagToKeys, removeTag, applyTags };
}

export function memoryAdapter(): CacheAdapter {
  const store = new Map<string, Entry>();
  const { tagToKeys, removeTag, applyTags } = createTagIndex();

  function prune(key: string): boolean {
    const e = store.get(key);
    if (!e) return true;
    if (e.expiresAt !== null && Date.now() > e.expiresAt) {
      store.delete(key);
      if (e.tags) for (const t of e.tags) removeTag(key, t);
      return true;
    }
    return false;
  }

  return {
    async get(key: string): Promise<string | null> {
      if (prune(key)) return null;
      return store.get(key)?.value ?? null;
    },

    async set(key: string, value: string, opts?: SetOptions): Promise<void> {
      const tags = opts?.tags;
      const parsed = parseTtl(opts?.ttl);
      let expiresAt: number | null;
      if (parsed === undefined) expiresAt = null;
      else if (typeof parsed === "number") expiresAt = Date.now() + parsed;
      else expiresAt = parsed.getTime();

      const existing = store.get(key);
      if (existing?.tags) for (const t of existing.tags) removeTag(key, t);

      store.set(key, { value, expiresAt, tags });
      applyTags(key, tags);
    },

    async delete(key: string): Promise<void> {
      const e = store.get(key);
      if (e?.tags) for (const t of e.tags) removeTag(key, t);
      store.delete(key);
    },

    async has(key: string): Promise<boolean> {
      return !prune(key) && store.has(key);
    },

    async getMany(keys: string[]): Promise<Map<string, string | null>> {
      const result = new Map<string, string | null>();
      for (const k of keys) {
        result.set(k, prune(k) ? null : (store.get(k)?.value ?? null));
      }
      return result;
    },

    async setMany(
      entries: Array<{ key: string; value: string; opts?: SetOptions }>
    ): Promise<void> {
      for (const e of entries) {
        const tags = e.opts?.tags;
        const parsed = parseTtl(e.opts?.ttl);
        const expiresAt =
          parsed === undefined
            ? null
            : typeof parsed === "number"
              ? Date.now() + parsed
              : parsed.getTime();

        const existing = store.get(e.key);
        if (existing?.tags) for (const t of existing.tags) removeTag(e.key, t);

        store.set(e.key, { value: e.value, expiresAt, tags });
        applyTags(e.key, tags);
      }
    },

    async deleteMany(keys: string[]): Promise<void> {
      for (const k of keys) {
        const e = store.get(k);
        if (e?.tags) for (const t of e.tags) removeTag(k, t);
        store.delete(k);
      }
    },

    async invalidateTag(tag: string): Promise<void> {
      const keys = tagToKeys.get(tag);
      if (keys) {
        for (const k of keys) store.delete(k);
        tagToKeys.delete(tag);
      }
    },

    async invalidateTags(tags: string[]): Promise<void> {
      for (const tag of tags) {
        const keys = tagToKeys.get(tag);
        if (keys) {
          for (const k of keys) store.delete(k);
          tagToKeys.delete(tag);
        }
      }
    },

    async getTagKeys(tag: string): Promise<string[]> {
      const keys = tagToKeys.get(tag);
      return keys ? Array.from(keys) : [];
    },
  };
}
