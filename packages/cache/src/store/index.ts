import type { StandardSchemaV1 } from "@standard-schema/spec";
import { createCacheEntry } from "../entry/index";
import type { CacheInstance, SetOptions } from "../types";

export interface StoreEntryDef<T> {
  key: (...args: string[]) => string;
  schema: StandardSchemaV1<unknown, T>;
  ttl?: SetOptions["ttl"];
  tags?: (...args: string[]) => string[];
}

export interface CreateCacheStoreOptions<TSchema extends Record<string, StoreEntryDef<unknown>>> {
  cache: CacheInstance;
  schema: TSchema;
}

type EntryFromDef<T> = T extends StoreEntryDef<infer U>
  ? {
      get: (...args: string[]) => Promise<U | null>;
      set: (value: U, ...args: string[]) => Promise<void>;
      delete: (...args: string[]) => Promise<void>;
      has: (...args: string[]) => Promise<boolean>;
      wrap: (fn: () => Promise<U>, ...args: string[]) => Promise<U>;
    }
  : never;

export type CacheStore<TSchema extends Record<string, StoreEntryDef<unknown>>> = {
  [K in keyof TSchema]: EntryFromDef<TSchema[K]>;
} & {
  invalidateTag(tag: string): Promise<void>;
};

export function createCacheStore<TSchema extends Record<string, StoreEntryDef<unknown>>>(
  options: CreateCacheStoreOptions<TSchema>
): CacheStore<TSchema> {
  const { cache, schema } = options;

  const result: Record<string, unknown> = {};

  for (const [name, def] of Object.entries(schema)) {
    const d = def;
    const entry = createCacheEntry({
      cache,
      key: (k: string) => k,
      schema: d.schema,
      ttl: d.ttl,
    });

    const getKey = (...args: string[]) => d.key(...args);
    const getOpts = (...args: string[]) => ({
      ttl: d.ttl,
      tags: d.tags?.(...args),
    });

    result[name] = {
      get: (...args: string[]) => entry.get(getKey(...args)),
      set: (value: unknown, ...args: string[]) =>
        entry.set(getKey(...args), value, getOpts(...args)),
      delete: (...args: string[]) => entry.delete(getKey(...args)),
      has: (...args: string[]) => entry.has(getKey(...args)),
      wrap: (fn: () => Promise<unknown>, ...args: string[]) =>
        entry.wrap(getKey(...args), fn, getOpts(...args)),
    };
  }

  result.invalidateTag = (tag: string) => cache.invalidateTag(tag);

  return result as CacheStore<TSchema>;
}
