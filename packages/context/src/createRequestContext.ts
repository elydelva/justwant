/**
 * @justwant/context — createRequestContext (internal)
 * Per-request instance with Map cache for slot resolution.
 */

import { ResolutionError, SlotNotFoundError } from "./errors/index.js";
import type { RequestContext, SlotDef } from "./types/index.js";

export interface CreateRequestContextOptions {
  initial: Record<string, unknown>;
  slots: readonly SlotDef<unknown>[];
}

export function createRequestContext(options: CreateRequestContextOptions): RequestContext {
  const { initial, slots } = options;
  const slotMap = new Map<string, SlotDef<unknown>>(slots.map((s) => [s.key, s]));
  const cache = new Map<SlotDef<unknown>, Promise<unknown>>();

  const requestCtx: RequestContext = {
    initial: Object.freeze({ ...initial }),

    async get<T>(slot: SlotDef<T>): Promise<T> {
      if (!slotMap.has(slot.key)) {
        throw new SlotNotFoundError(
          `Slot "${slot.key}" is not registered in this context`,
          slot.key
        );
      }

      let promise = cache.get(slot) as Promise<T> | undefined;
      if (!promise) {
        promise = (async () => {
          try {
            return (await slot.resolve(requestCtx)) as T;
          } catch (err) {
            throw new ResolutionError(`Failed to resolve slot "${slot.key}"`, slot.key, err);
          }
        })();
        cache.set(slot, promise);
      }
      return promise;
    },
  };

  return requestCtx;
}
