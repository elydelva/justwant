/**
 * @justwant/context — createContext
 * Creates a ContextApi that produces RequestContext instances.
 * Eager and request scopes are resolved at forRequest(); on-demand at first get().
 */

import { createRequestContext } from "./createRequestContext.js";
import type { ContextApi, ContextOptions, RequestContext, SlotDef } from "./types/index.js";

export function createContext(options: ContextOptions): ContextApi {
  const { slots } = options;
  const slotList = [...slots];

  return {
    forRequest(initial: Record<string, unknown>): RequestContext {
      const requestCtx = createRequestContext({ initial, slots: slotList });

      // Resolve eager and request scopes immediately
      const toResolveNow = slotList.filter((s) => s.scope === "eager" || s.scope === "request");
      for (const slot of toResolveNow) {
        void requestCtx.get(slot);
      }

      return requestCtx;
    },
  };
}
