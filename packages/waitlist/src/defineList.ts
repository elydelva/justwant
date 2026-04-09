/**
 * @justwant/waitlist — defineList
 * Portable list definition without runtime dependencies.
 */

import type { Definable } from "@justwant/meta";
import type { WaitlistMetadataSchema } from "./types.js";

export interface DefineListConfig<N extends string = string, TMetadata = unknown> {
  name: N;
  /** Parameters for parameterized listKeys (e.g. ["productId"]). */
  params?: string[];
  schema?: WaitlistMetadataSchema<TMetadata>;
  defaults?: Record<string, unknown>;
}

/**
 * List definition — portable, extends Definable<N>.
 * Callable: list(actorId) → { type: N; id: actorId }
 * .key(...paramValues) → resolves listKey string ("name" or "name:param1:param2")
 */
export interface WaitlistDef<N extends string = string, TMetadata = unknown> extends Definable<N> {
  readonly name: N;
  readonly params?: string[];
  readonly schema?: WaitlistMetadataSchema<TMetadata>;
  readonly defaults?: Record<string, unknown>;
  key(...paramValues: string[]): string;
}

export function defineList<N extends string, TMetadata = unknown>(
  config: DefineListConfig<N, TMetadata>
): WaitlistDef<N, TMetadata> {
  const { name, schema } = config;

  const listDef = ((actorId: string) => ({ type: name, id: actorId })) as WaitlistDef<N, TMetadata>;

  const keyFn = (...paramValues: string[]): string => {
    if (config.params?.length) {
      if (paramValues.length !== config.params.length) {
        throw new Error(
          `defineList "${name}" expects ${config.params.length} params, got ${paramValues.length}`
        );
      }
      return [name, ...paramValues].join(":");
    }
    return name;
  };

  Object.defineProperties(listDef, {
    name: { value: name, enumerable: true },
    params: { value: config.params, enumerable: true },
    schema: { value: schema, enumerable: true },
    defaults: { value: config.defaults, enumerable: true },
    key: { value: keyFn, enumerable: false },
  });

  return listDef;
}
