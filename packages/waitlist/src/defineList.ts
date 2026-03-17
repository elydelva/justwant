/**
 * @justwant/waitlist — defineList
 * Portable list definition without runtime dependencies.
 */

import type { WaitlistMetadataSchema } from "./types.js";

export interface DefineListConfig<TMetadata = unknown> {
  id: string;
  name?: string;
  /** Parameters for parameterized lists (e.g. ["productId"]). */
  params?: string[];
  /** Optional schema for metadata validation. */
  schema?: WaitlistMetadataSchema<TMetadata>;
  defaults?: Record<string, unknown>;
}

/** List definition — portable. Callable when params are defined. */
export interface WaitlistDef<TMetadata = unknown> {
  readonly id: string;
  readonly name?: string;
  readonly params?: string[];
  readonly schema?: WaitlistMetadataSchema<TMetadata>;
  readonly defaults?: Record<string, unknown>;
}

/** Resolved list reference (id or id:param1:param2). */
export type WaitlistList<TMetadata = unknown> = WaitlistDef<TMetadata> & {
  listKey: string;
};

/**
 * Define a waitlist. Returns a portable definition.
 * When params are provided, the result is callable: list("prod-1") → WaitlistList.
 */
export function defineList<TMetadata = unknown>(
  config: DefineListConfig<TMetadata>
): WaitlistDef<TMetadata> & ((...paramValues: string[]) => WaitlistList<TMetadata>) {
  const def: WaitlistDef<TMetadata> = {
    id: config.id,
    name: config.name,
    params: config.params,
    schema: config.schema,
    defaults: config.defaults,
  };

  const callable = (...paramValues: string[]) => {
    if (config.params?.length) {
      if (paramValues.length !== config.params.length) {
        throw new Error(
          `defineList "${config.id}" expects ${config.params.length} params, got ${paramValues.length}`
        );
      }
      const listKey = [config.id, ...paramValues].join(":");
      return { ...def, listKey } as WaitlistList<TMetadata>;
    }
    return { ...def, listKey: config.id } as WaitlistList<TMetadata>;
  };

  return new Proxy(callable, {
    get(_target, prop) {
      if (prop in def) return (def as unknown as Record<string | symbol, unknown>)[prop];
      return Reflect.get(callable as object, prop);
    },
  }) as WaitlistDef<TMetadata> & ((...paramValues: string[]) => WaitlistList<TMetadata>);
}
