import type { CachePlugin, CachePluginContext, CacheSerializer } from "../types.js";

export interface SerializePluginOptions {
  serializer: CacheSerializer;
}

/**
 * Replaces the default JSON serializer with a custom one (e.g. superjson, msgpack).
 */
export function serializePlugin(options: SerializePluginOptions): CachePlugin {
  const { serializer } = options;

  return {
    name: "serialize",
    init(context: CachePluginContext) {
      context.setSerializer?.(serializer);
    },
  };
}
