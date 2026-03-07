import type {
  CacheAdapter,
  CacheDefaults,
  CacheInstance,
  CacheInternal,
  CachePlugin,
  CreateCacheOptions,
  OnError,
  SetOptions,
} from "./types.js";

const DEFAULT_DEFAULTS: Required<CacheDefaults> = {
  ttl: "1h",
  tags: [],
  serialize: true,
};

function defaultSerializer() {
  return {
    serialize: (v: unknown) => JSON.stringify(v),
    deserialize: (s: string) => JSON.parse(s) as unknown,
  };
}

function runWithErrorHandling<T>(fn: () => Promise<T>, onError: OnError, fallback: T): Promise<T> {
  return fn().catch((err) => {
    if (onError === "throw") throw err;
    if (onError === "silent") {
      console.error("[@justwant/cache]", err);
      return fallback;
    }
    if (onError === "fallback") return fallback;
    return fallback;
  });
}

export function createCache(options: CreateCacheOptions): CacheInstance {
  const { adapter, plugins = [], defaults = {}, onError = "silent" } = options;

  const resolvedDefaults: Required<CacheDefaults> = {
    ...DEFAULT_DEFAULTS,
    ...defaults,
  };

  let serializerRef = defaultSerializer();
  let statsFn: (() => import("./types.js").CacheStats) | undefined;
  const context = {
    adapter,
    defaults: resolvedDefaults,
    onError,
    setSerializer: (s: import("./types.js").CacheSerializer) => {
      serializerRef = s;
    },
    setStats: (fn: () => import("./types.js").CacheStats) => {
      statsFn = fn;
    },
  };

  for (const plugin of plugins) {
    plugin.init?.(context);
  }

  function buildGetChain(): (key: string) => Promise<string | null> {
    let next: (key: string) => Promise<string | null> = (k) => adapter.get(k);
    for (let i = plugins.length - 1; i >= 0; i--) {
      const p = plugins[i];
      if (p?.get) {
        const n = next;
        const get = p.get;
        next = (k) => get(k, (overrideKey) => n(overrideKey !== undefined ? overrideKey : k));
      }
    }
    return next;
  }

  function buildSetChain(): (
    key: string,
    value: string,
    opts: SetOptions | undefined
  ) => Promise<void> {
    let next: (key: string, value: string, opts: SetOptions | undefined) => Promise<void> = (
      k,
      v,
      o
    ) => adapter.set(k, v, o);
    for (let i = plugins.length - 1; i >= 0; i--) {
      const p = plugins[i];
      if (p?.set) {
        const n = next;
        const set = p.set;
        next = (k, v, o) =>
          set(k, v, o, (ok, ov, oo) =>
            n(ok !== undefined ? ok : k, ov !== undefined ? ov : v, oo !== undefined ? oo : o)
          );
      }
    }
    return next;
  }

  function buildDeleteChain(): (key: string) => Promise<void> {
    let next: (key: string) => Promise<void> = (k) => adapter.delete(k);
    for (let i = plugins.length - 1; i >= 0; i--) {
      const p = plugins[i];
      if (p?.delete) {
        const n = next;
        const del = p.delete;
        next = (k) => del(k, (overrideKey) => n(overrideKey !== undefined ? overrideKey : k));
      }
    }
    return next;
  }

  function buildHasChain(): (key: string) => Promise<boolean> {
    let next: (key: string) => Promise<boolean> = (k) => adapter.has(k);
    for (let i = plugins.length - 1; i >= 0; i--) {
      const p = plugins[i];
      if (p?.has) {
        const n = next;
        const has = p.has;
        next = (k) => has(k, (overrideKey) => n(overrideKey !== undefined ? overrideKey : k));
      }
    }
    return next;
  }

  const getChain = buildGetChain();
  const setChain = buildSetChain();
  const deleteChain = buildDeleteChain();
  const hasChain = buildHasChain();

  const serializer = serializerRef;

  function mergeOpts(opts?: SetOptions): SetOptions {
    return {
      ttl: opts?.ttl ?? resolvedDefaults.ttl,
      tags: opts?.tags ?? resolvedDefaults.tags,
    };
  }

  function serialize(value: unknown): string {
    return serializer.serialize(value);
  }

  function deserialize<T>(raw: string | null): T | null {
    if (raw === null) return null;
    try {
      return serializer.deserialize(raw) as T;
    } catch {
      return null;
    }
  }

  const cache: CacheInstance = {
    async get<T = unknown>(key: string): Promise<T | null> {
      return runWithErrorHandling(
        async () => {
          const raw = await getChain(key);
          return deserialize<T>(raw);
        },
        onError,
        null as T | null
      );
    },

    async set(key: string, value: unknown, opts?: SetOptions): Promise<void> {
      return runWithErrorHandling(
        async () => {
          const merged = mergeOpts(opts);
          const str = serialize(value);
          await setChain(key, str, merged);
        },
        onError,
        undefined
      );
    },

    async delete(key: string): Promise<void> {
      return runWithErrorHandling(() => deleteChain(key), onError, undefined);
    },

    async has(key: string): Promise<boolean> {
      return runWithErrorHandling(() => hasChain(key), onError, false);
    },

    async wrap<T>(key: string, fn: () => Promise<T>, opts?: SetOptions): Promise<T> {
      const val = await cache.get<T>(key);
      if (val !== null) return val;
      const result = await fn();
      await cache.set(key, result, opts);
      return result;
    },

    async pull<T = unknown>(key: string): Promise<T | null> {
      const val = await cache.get<T>(key);
      if (val !== null) await cache.delete(key);
      return val;
    },

    async setNx(key: string, value: unknown, opts?: SetOptions): Promise<boolean> {
      const exists = await cache.has(key);
      if (exists) return false;
      await cache.set(key, value, opts);
      return true;
    },

    async ttl(key: string): Promise<number | null | -1> {
      if (!adapter.ttl) {
        return runWithErrorHandling(
          async () => {
            const exists = await adapter.has(key);
            return exists ? null : -1;
          },
          onError,
          -1
        );
      }
      const ttlFn = adapter.ttl;
      return runWithErrorHandling(() => ttlFn(key), onError, -1);
    },

    async expire(key: string, ttl: import("./types.js").TTL): Promise<void> {
      if (!adapter.expire) return;
      const expireFn = adapter.expire;
      return runWithErrorHandling(() => expireFn(key, ttl), onError, undefined);
    },

    async persist(key: string): Promise<void> {
      if (!adapter.persist) return;
      const persistFn = adapter.persist;
      return runWithErrorHandling(() => persistFn(key), onError, undefined);
    },

    async invalidateTag(tag: string): Promise<void> {
      if (!adapter.invalidateTag) return;
      const invalidateTagFn = adapter.invalidateTag;
      return runWithErrorHandling(() => invalidateTagFn(tag), onError, undefined);
    },

    async invalidateTags(tags: string[]): Promise<void> {
      if (!adapter.invalidateTags) {
        for (const tag of tags) await cache.invalidateTag(tag);
        return;
      }
      const invalidateTagsFn = adapter.invalidateTags;
      return runWithErrorHandling(() => invalidateTagsFn(tags), onError, undefined);
    },

    async getTagKeys(tag: string): Promise<string[]> {
      if (!adapter.getTagKeys) return [];
      const getTagKeysFn = adapter.getTagKeys;
      return runWithErrorHandling(() => getTagKeysFn(tag), onError, []);
    },

    async getMany<T = unknown>(keys: string[]): Promise<Map<string, T | null>> {
      if (adapter.getMany) {
        const getMany = adapter.getMany;
        const raw = await runWithErrorHandling(
          () => getMany(keys),
          onError,
          new Map<string, string | null>()
        );
        const result = new Map<string, T | null>();
        for (const [k, v] of raw) {
          result.set(k, deserialize<T>(v));
        }
        return result;
      }
      const result = new Map<string, T | null>();
      for (const k of keys) {
        result.set(k, await cache.get<T>(k));
      }
      return result;
    },

    async setMany(
      entries: Array<{ key: string; value: unknown; opts?: SetOptions }>
    ): Promise<void> {
      if (adapter.setMany) {
        const serialized = entries.map((e) => ({
          key: e.key,
          value: serialize(e.value),
          opts: mergeOpts(e.opts),
        }));
        const setMany = adapter.setMany;
        await runWithErrorHandling(() => setMany(serialized), onError, undefined);
        return;
      }
      for (const e of entries) {
        await cache.set(e.key, e.value, e.opts);
      }
    },

    async deleteMany(keys: string[]): Promise<void> {
      if (adapter.deleteMany) {
        const deleteMany = adapter.deleteMany;
        await runWithErrorHandling(() => deleteMany(keys), onError, undefined);
        return;
      }
      for (const k of keys) {
        await cache.delete(k);
      }
    },

    async wrapMany<T>(
      keys: string[],
      fetchMissing: (missingKeys: string[]) => Promise<T[]>,
      opts?: SetOptions & { keyFn?: (item: T) => string }
    ): Promise<Map<string, T>> {
      const existing = await cache.getMany<T>(keys);
      const missing: string[] = [];
      for (const k of keys) {
        if (!existing.has(k) || existing.get(k) === null) {
          missing.push(k);
        }
      }
      const result = new Map<string, T>();
      for (const k of keys) {
        const v = existing.get(k);
        if (v !== null && v !== undefined) result.set(k, v);
      }
      if (missing.length > 0) {
        const fetched = await fetchMissing(missing);
        const keyFn = opts?.keyFn;
        if (keyFn) {
          for (const item of fetched) {
            const k = keyFn(item);
            result.set(k, item);
            await cache.set(k, item, opts);
          }
        } else {
          for (let i = 0; i < missing.length; i++) {
            const k = missing[i];
            const item = fetched[i];
            if (k !== undefined && item !== undefined) {
              result.set(k, item);
              await cache.set(k, item, opts);
            }
          }
        }
      }
      return result;
    },

    stats: (() => {
      const fn = statsFn;
      return fn ? () => fn() : undefined;
    })(),

    namespace(
      prefix: string,
      nsOpts?: Partial<CacheDefaults> & { onError?: OnError }
    ): CacheInstance {
      const prefixedKey = (k: string) => `${prefix}:${k}`;
      const wrappedAdapter: CacheAdapter = {
        get: (k) => adapter.get(prefixedKey(k)),
        set: (k, v, o) => adapter.set(prefixedKey(k), v, o),
        delete: (k) => adapter.delete(prefixedKey(k)),
        has: (k) => adapter.has(prefixedKey(k)),
        getMany: (() => {
          const getMany = adapter.getMany;
          return getMany
            ? (keys: string[]) =>
                getMany(keys.map(prefixedKey)).then((m) => {
                  const out = new Map<string, string | null>();
                  for (const k of keys) {
                    out.set(k, m.get(prefixedKey(k)) ?? null);
                  }
                  return out;
                })
            : undefined;
        })(),
        setMany: (() => {
          const setMany = adapter.setMany;
          return setMany
            ? (entries: Array<{ key: string; value: string; opts?: SetOptions }>) =>
                setMany(
                  entries.map((e) => ({
                    ...e,
                    key: prefixedKey(e.key),
                  }))
                )
            : undefined;
        })(),
        deleteMany: (() => {
          const deleteMany = adapter.deleteMany;
          return deleteMany ? (keys: string[]) => deleteMany(keys.map(prefixedKey)) : undefined;
        })(),
        ttl: (() => {
          const ttl = adapter.ttl;
          return ttl ? (k: string) => ttl(prefixedKey(k)) : undefined;
        })(),
        expire: (() => {
          const expire = adapter.expire;
          return expire
            ? (k: string, ttl: import("./types.js").TTL) => expire(prefixedKey(k), ttl)
            : undefined;
        })(),
        persist: (() => {
          const persist = adapter.persist;
          return persist ? (k: string) => persist(prefixedKey(k)) : undefined;
        })(),
        invalidateTag: adapter.invalidateTag,
        invalidateTags: adapter.invalidateTags,
        getTagKeys: adapter.getTagKeys,
      };
      return createCache({
        adapter: wrappedAdapter,
        plugins,
        defaults: { ...resolvedDefaults, ...nsOpts },
        onError: nsOpts?.onError ?? onError,
      });
    },

    _internal: {
      adapter,
      plugins,
      defaults: resolvedDefaults,
    },
  };

  return cache;
}
