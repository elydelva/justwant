/**
 * @justwant/context — Core types
 * SlotScope: when a slot is resolved.
 * SlotDef: definition of a context slot.
 * RequestContext: per-request instance with cache.
 * ContextApi: factory for request contexts.
 */

/** When a slot is resolved */
export type SlotScope = "request" | "on-demand" | "eager";

/** Definition of a context slot */
export interface SlotDef<T> {
  readonly key: string;
  readonly scope: SlotScope;
  readonly resolve: (ctx: RequestContext) => Promise<T>;
}

/** Per-request context instance with memoized slot resolution */
export interface RequestContext {
  readonly initial: Record<string, unknown>;
  get<T>(slot: SlotDef<T>): Promise<T>;
}

/** Options for createContext */
export interface ContextOptions {
  slots: readonly SlotDef<unknown>[];
}

/** Factory API for creating request contexts */
export interface ContextApi {
  forRequest(initial: Record<string, unknown>): RequestContext;
}
