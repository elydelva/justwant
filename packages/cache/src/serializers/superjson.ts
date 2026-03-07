import type { CacheSerializer } from "../types.js";

/**
 * Superjson serializer. Handles Date, Map, Set, BigInt, etc.
 * Requires 'superjson' as peer dependency.
 */
export function superjsonSerializer(): CacheSerializer {
  try {
    const superjson = require("superjson");
    return {
      serialize: (v: unknown) => superjson.stringify(v),
      deserialize: (s: string) => superjson.parse(s),
    };
  } catch {
    return {
      serialize: (v: unknown) => JSON.stringify(v),
      deserialize: (s: string) => JSON.parse(s) as unknown,
    };
  }
}
