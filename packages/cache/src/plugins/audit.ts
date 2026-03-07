import type { CachePlugin } from "../types.js";

export interface AuditPluginOptions {
  onGet?: (key: string, hit: boolean) => void | Promise<void>;
  onSet?: (key: string) => void | Promise<void>;
  onDelete?: (key: string) => void | Promise<void>;
}

/**
 * Audit hook for cache operations. Use for logging, metrics, or compliance.
 */
export function auditPlugin(options: AuditPluginOptions = {}): CachePlugin {
  const { onGet, onSet, onDelete } = options;

  return {
    name: "audit",
    async get(key, next) {
      const v = await next(key);
      onGet?.(key, v !== null);
      return v;
    },
    async set(key, value, opts, next) {
      await next(key, value, opts);
      onSet?.(key);
    },
    async delete(key, next) {
      await next(key);
      onDelete?.(key);
    },
  };
}
