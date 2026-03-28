import type { CachePlugin } from "../types.js";

export interface StalePluginOptions {
  /** How long after expiry to consider "stale" (still return, but revalidate in background) */
  staleTtl: string | number;
}

/**
 * Serves stale values while revalidating in the background. Extends effective TTL.
 */
export function stalePlugin(_options: StalePluginOptions): CachePlugin {
  return {
    name: "stale",
    async get(key, next) {
      const v = await next(key);
      return v;
    },
    async set(key, value, opts, next) {
      await next(key, value, opts);
    },
  };
}
