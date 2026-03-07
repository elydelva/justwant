import type { StandardSchemaV1 } from "@standard-schema/spec";
import { createCacheEntry } from "../entry/index";
import type { CacheInstance, SetOptions } from "../types";

export interface CollectionEntryDef<T> {
  key: (id: string) => string;
  schema: StandardSchemaV1<unknown, T>;
  ttl?: SetOptions["ttl"];
  tags?: (id: string) => string[];
}

export interface CreateCacheCollectionOptions<
  TEntries extends Record<string, CollectionEntryDef<unknown>>,
> {
  cache: CacheInstance;
  namespace: string;
  entries: TEntries;
}

export type CacheCollection<TEntries extends Record<string, CollectionEntryDef<unknown>>> = {
  [K in keyof TEntries]: TEntries[K] extends CollectionEntryDef<infer T>
    ? ReturnType<typeof createCacheEntry<T>>
    : never;
} & {
  invalidate(id: string): Promise<void>;
};

export function createCacheCollection<TEntries extends Record<string, CollectionEntryDef<unknown>>>(
  options: CreateCacheCollectionOptions<TEntries>
): CacheCollection<TEntries> {
  const { cache, namespace, entries } = options;
  const nsCache = cache.namespace(namespace);

  const result: Record<string, unknown> = {};

  for (const [name, def] of Object.entries(entries)) {
    const d = def as CollectionEntryDef<unknown>;
    const entry = createCacheEntry({
      cache: nsCache,
      key: d.key,
      schema: d.schema,
      ttl: d.ttl,
      tags: d.tags,
      invalidateTag: `${namespace}`,
    });
    result[name] = entry;
  }

  result.invalidate = async (id: string) => {
    await nsCache.invalidateTag(id);
  };

  return result as CacheCollection<TEntries>;
}
