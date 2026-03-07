/**
 * @justwant/context — defineSlot
 * Defines a context slot with key, scope, and resolve function.
 */

import type { RequestContext, SlotDef, SlotScope } from "./types/index.js";

export interface DefineSlotOptions<T> {
  key: string;
  scope: SlotScope;
  resolve: (ctx: RequestContext) => Promise<T>;
}

export function defineSlot<T>(options: DefineSlotOptions<T>): SlotDef<T> {
  const { key, scope, resolve } = options;
  return Object.freeze({
    key,
    scope,
    resolve,
  });
}
