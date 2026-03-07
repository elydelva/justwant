import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { CacheInstance, SetOptions } from "../types.js";

export interface CreateCacheEntryOptions<T> {
  cache: CacheInstance;
  key: (id: string) => string;
  schema: StandardSchemaV1<unknown, T>;
  ttl?: SetOptions["ttl"];
  tags?: (id: string) => string[];
  invalidateTag?: string;
}

function validateSchema<T>(
  schema: StandardSchemaV1<unknown, T>,
  value: unknown
): { valid: boolean; value?: T } {
  const std = (schema as { "~standard"?: { validate: (v: unknown) => unknown } })["~standard"];
  if (!std?.validate) return { valid: true, value: value as T };
  const result = std.validate(value);
  if (result && typeof (result as Promise<unknown>).then === "function") {
    return { valid: false };
  }
  const r = result as { value?: T; issues?: readonly unknown[] };
  if (r.issues?.length) return { valid: false };
  return { valid: true, value: r.value };
}

export interface CacheEntry<T> {
  get(id: string): Promise<T | null>;
  set(id: string, value: T, opts?: SetOptions): Promise<void>;
  delete(id: string): Promise<void>;
  has(id: string): Promise<boolean>;
  wrap(id: string, fn: () => Promise<T>, opts?: SetOptions): Promise<T>;
}

export function createCacheEntry<T>(options: CreateCacheEntryOptions<T>): CacheEntry<T> {
  const { cache, key, schema, ttl: defaultTtl, tags: tagsFn } = options;

  const getCacheKey = (id: string) => key(id);

  const getOpts = (id: string): SetOptions => ({
    ttl: defaultTtl,
    tags: tagsFn?.(id),
  });

  return {
    async get(id: string): Promise<T | null> {
      const raw = await cache.get<unknown>(getCacheKey(id));
      if (raw === null) return null;
      const { valid, value } = validateSchema(schema, raw);
      return valid && value !== undefined ? value : null;
    },

    async set(id: string, value: T, opts?: SetOptions): Promise<void> {
      const { valid, value: validated } = validateSchema(schema, value);
      if (!valid || validated === undefined) {
        throw new Error("Cache entry validation failed");
      }
      const merged: SetOptions = {
        ...getOpts(id),
        ...opts,
      };
      await cache.set(getCacheKey(id), validated, merged);
    },

    async delete(id: string): Promise<void> {
      await cache.delete(getCacheKey(id));
    },

    async has(id: string): Promise<boolean> {
      return cache.has(getCacheKey(id));
    },

    async wrap(id: string, fn: () => Promise<T>, opts?: SetOptions): Promise<T> {
      const val = await cache.get<unknown>(getCacheKey(id));
      if (val !== null) {
        const { valid, value } = validateSchema(schema, val);
        if (valid && value !== undefined) return value;
      }
      const result = await fn();
      const merged: SetOptions = { ...getOpts(id), ...opts };
      await cache.set(getCacheKey(id), result, merged);
      return result;
    },
  };
}
