import type { CachePlugin } from "../types.js";

const inFlight = new Map<string, Promise<string | null>>();

/**
 * Deduplicates concurrent get requests for the same key.
 */
export function dedupePlugin(): CachePlugin {
  return {
    name: "dedupe",
    async get(key, next) {
      const existing = inFlight.get(key);
      if (existing) return existing;

      const p = next(key).finally(() => {
        inFlight.delete(key);
      });
      inFlight.set(key, p);
      return p;
    },
  };
}
