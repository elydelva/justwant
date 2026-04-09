/**
 * @justwant/meta — Foundation interfaces. Zero dependencies.
 *
 * Provides the structural contracts that all define* functions
 * in the @justwant ecosystem satisfy.
 */

/**
 * Inspectable<N> — anything with a stable literal name for introspection/debugging.
 * Satisfied structurally — no import needed by implementers.
 * Used directly by config descriptors (RoleDef, RuleDef, …) that are named
 * but not callable. Callable factories extend Definable<N> instead.
 */
export interface Inspectable<N extends string = string> {
  readonly name: N;
}

/**
 * Definable<K> — a callable factory function that constructs typed references.
 * K is the literal string type for the "type" field of the produced reference.
 *
 * All define* functions in the ecosystem satisfy this structurally:
 *   ActorDef<N>      satisfies Definable<N>
 *   ResourceDef<N>   satisfies Definable<N>
 *   MemberDef<N>     satisfies Definable<N>
 *   FeatureDef<N>    satisfies Definable<N>
 */
export interface Definable<K extends string = string> extends Inspectable<K> {
  (id: string): { type: K; id: string };
}

/**
 * RefLike<T> — the canonical shape produced by all Definable functions.
 * Universal entity reference across the ecosystem: { type, id }.
 */
export interface RefLike<T extends string = string> {
  type: T;
  id: string;
}
