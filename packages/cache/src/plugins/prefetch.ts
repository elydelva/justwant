import type { CachePlugin } from "../types.js";

export interface PrefetchPluginOptions {
  /** Keys to prefetch when any get is called (e.g. related keys) */
  keyFn?: (key: string) => string[];
  /** Max keys to prefetch per get */
  maxKeys?: number;
}

/**
 * Prefetches related keys on get. Does not return them; warms the cache.
 */
export function prefetchPlugin(options: PrefetchPluginOptions = {}): CachePlugin {
  const { keyFn, maxKeys = 10 } = options;

  if (!keyFn) {
    return { name: "prefetch" };
  }

  return {
    name: "prefetch",
    async get(key, next) {
      const v = await next(key);
      const related = keyFn(key).slice(0, maxKeys);
      if (related.length > 0) {
        next(related[0]).catch(() => {});
        for (let i = 1; i < related.length; i++) {
          next(related[i]).catch(() => {});
        }
      }
      return v;
    },
  };
}
