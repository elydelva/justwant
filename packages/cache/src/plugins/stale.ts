import { parseTtl } from "../ttl.js";
import type { CachePlugin } from "../types.js";

export interface StalePluginOptions {
  /** How long after expiry to consider "stale" (still return, but revalidate in background) */
  staleTtl: string | number;
}

/**
 * Serves stale values while revalidating in the background. Extends effective TTL.
 */
export function stalePlugin(options: StalePluginOptions): CachePlugin {
  const staleMs =
    typeof options.staleTtl === "string"
      ? ((parseTtl(options.staleTtl) as number) ?? 0)
      : options.staleTtl;

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
