/**
 * @justwant/context — Modular context with explicit propagation
 * No AsyncLocalStorage. Context is passed explicitly to children.
 * Compatible Node, Edge, Bun, Deno.
 */

export { defineSlot } from "./defineSlot.js";
export type { DefineSlotOptions } from "./defineSlot.js";

export { createContextService } from "./createContextService.js";

export type {
  SlotDef,
  SlotScope,
  RequestContext,
  ContextApi,
  ContextOptions,
} from "./types/index.js";

export {
  ContextError,
  SlotNotFoundError,
  ResolutionError,
} from "./errors/index.js";
