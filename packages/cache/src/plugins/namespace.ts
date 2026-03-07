import type { CachePlugin } from "../types.js";

export interface NamespacePluginOptions {
  prefix: string;
}

/**
 * Prefixes all keys with a namespace. Use createCache().namespace() for the same effect;
 * this plugin is for when you want namespace as part of the plugin pipeline.
 */
export function namespacePlugin(options: NamespacePluginOptions): CachePlugin {
  const { prefix } = options;
  const p = prefix.endsWith(":") ? prefix : `${prefix}:`;

  return {
    name: "namespace",
    get(key, next) {
      return next(`${p}${key}`);
    },
    set(key, value, opts, next) {
      return next(`${p}${key}`, value, opts);
    },
    delete(key, next) {
      return next(`${p}${key}`);
    },
    has(key, next) {
      return next(`${p}${key}`);
    },
  };
}
