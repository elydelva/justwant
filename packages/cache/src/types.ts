/**
 * TTL: string ('30s', '5m', '2h', '7d'), number (ms), or Date (absolute expiry)
 */
export type TTL = string | number | Date;

export interface SetOptions {
  ttl?: TTL;
  tags?: string[];
}

export interface CacheAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, opts?: SetOptions): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  getMany?(keys: string[]): Promise<Map<string, string | null>>;
  setMany?(entries: Array<{ key: string; value: string; opts?: SetOptions }>): Promise<void>;
  deleteMany?(keys: string[]): Promise<void>;
  ttl?(key: string): Promise<number | null | -1>;
  expire?(key: string, ttl: TTL): Promise<void>;
  persist?(key: string): Promise<void>;
  invalidateTag?(tag: string): Promise<void>;
  invalidateTags?(tags: string[]): Promise<void>;
  getTagKeys?(tag: string): Promise<string[]>;
}

export type OnError = "throw" | "silent" | "fallback";

export interface CacheDefaults {
  ttl?: TTL;
  tags?: string[];
  serialize?: boolean;
}

export interface CreateCacheOptions {
  adapter: CacheAdapter;
  plugins?: CachePlugin[];
  defaults?: CacheDefaults;
  onError?: OnError;
}

export type GetNext = (overrideKey?: string) => Promise<string | null>;
export type SetNext = (
  overrideKey?: string,
  overrideValue?: string,
  overrideOpts?: SetOptions
) => Promise<void>;
export type DeleteNext = (overrideKey?: string) => Promise<void>;
export type HasNext = (overrideKey?: string) => Promise<boolean>;

export interface CachePlugin {
  name: string;
  init?(context: CachePluginContext): void | Promise<void>;
  get?(key: string, next: GetNext): Promise<string | null>;
  set?(key: string, value: string, opts: SetOptions | undefined, next: SetNext): Promise<void>;
  delete?(key: string, next: DeleteNext): Promise<void>;
  has?(key: string, next: HasNext): Promise<boolean>;
}

export interface CacheSerializer {
  serialize: (value: unknown) => string;
  deserialize: (raw: string) => unknown;
}

export interface CachePluginContext {
  adapter: CacheAdapter;
  defaults: Required<CacheDefaults>;
  onError: OnError;
  setSerializer?: (serializer: CacheSerializer) => void;
  setStats?: (fn: () => CacheStats) => void;
}

export interface CacheInstance {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: SetOptions): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  wrap<T>(key: string, fn: () => Promise<T>, opts?: SetOptions): Promise<T>;
  pull<T = unknown>(key: string): Promise<T | null>;
  setNx(key: string, value: unknown, opts?: SetOptions): Promise<boolean>;
  ttl(key: string): Promise<number | null | -1>;
  expire(key: string, ttl: TTL): Promise<void>;
  persist(key: string): Promise<void>;
  invalidateTag(tag: string): Promise<void>;
  invalidateTags(tags: string[]): Promise<void>;
  getTagKeys(tag: string): Promise<string[]>;
  getMany<T = unknown>(keys: string[]): Promise<Map<string, T | null>>;
  setMany(entries: Array<{ key: string; value: unknown; opts?: SetOptions }>): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
  wrapMany<T>(
    keys: string[],
    fetchMissing: (missingKeys: string[]) => Promise<T[]>,
    opts?: SetOptions & { keyFn?: (item: T) => string }
  ): Promise<Map<string, T>>;
  namespace(prefix: string, opts?: Partial<CacheDefaults> & { onError?: OnError }): CacheInstance;
  stats?(): CacheStats;
  _internal: CacheInternal;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  sets: number;
  deletes: number;
  errors: number;
  latency: {
    get: { p50: number; p95: number; p99: number };
    set: { p50: number; p95: number; p99: number };
  };
}

export interface CacheInternal {
  adapter: CacheAdapter;
  plugins: CachePlugin[];
  defaults: Required<CacheDefaults>;
}
