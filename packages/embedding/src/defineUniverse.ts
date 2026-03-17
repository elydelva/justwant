/**
 * @justwant/embedding — Define a universe (logical index) for embeddings.
 */

import type { Embeddable, Universe } from "./types.js";

export interface DefineUniverseOptions<T> {
  /** Logical index id (e.g. "missions", "bdes"). */
  id: string;
  /** Vector dimension. Must match engine and storage. */
  dimension: number;
  /** How to embed objects of this universe. */
  embeddable: Embeddable<T>;
}

/**
 * Creates a universe definition for a type of embeddable object.
 */
export function defineUniverse<T>(options: DefineUniverseOptions<T>): Universe<T> {
  const { id, dimension, embeddable } = options;
  return {
    id,
    dimension,
    embeddable,
  };
}
