/**
 * @justwant/embedding — Types for engine + storage abstraction.
 * Engine: text → vector. Storage: vectors + similarity search.
 */

/** Capability required: only storages providing similarity search (k-NN) are accepted. */
export const EMBEDDING_CAPABILITY = "similarity-search" as const;

/** Embedding engine: produces a vector from text. No capability. */
export interface EmbeddingEngine {
  /** Text → vector. Dimension must match universes. */
  embed(text: string, options?: { model?: string }): Promise<number[]>;
  /** Optional batch embedding. */
  embedMany?(texts: string[]): Promise<number[][]>;
}

/** Vector storage: stores vectors and provides similarity search (k-NN). */
export interface VectorStorage {
  readonly capability: typeof EMBEDDING_CAPABILITY;

  upsert(
    indexId: string,
    vectors: Array<{ id: string; vector: number[]; metadata?: Record<string, unknown> }>
  ): Promise<void>;

  query(
    indexId: string,
    vector: number[],
    options?: { topK?: number; filter?: Record<string, unknown>; includeMetadata?: boolean }
  ): Promise<Array<{ id: string; score: number; metadata?: Record<string, unknown> }>>;

  delete?(indexId: string, ids: string[]): Promise<void>;
}

/** Embeddable definition: how to reduce an object to text and metadata. */
export interface Embeddable<T = unknown> {
  /** Field name on the item that holds the unique id. */
  idField: string;
  /** Reduces item to text for embedding. */
  toText: (item: T) => string;
  /** Optional metadata keys to store alongside the vector. */
  metadataFields?: readonly string[];
}

/** Universe definition: logical index for a type of object. */
export interface Universe<T = unknown> {
  /** Logical index id (e.g. "missions", "bdes"). */
  id: string;
  /** Vector dimension. Must match engine and storage. */
  dimension: number;
  /** How to embed objects of this universe. */
  embeddable: Embeddable<T>;
}

/** Options for createEmbeddingService. */
export interface CreateEmbeddingServiceOptions {
  engine: EmbeddingEngine;
  storage: VectorStorage;
  universes: Universe[];
}

/** Options for similar() query. */
export interface SimilarOptions {
  /** Text to embed and search by. Mutually exclusive with vector. */
  text?: string;
  /** Pre-computed vector to search by. Mutually exclusive with text. */
  vector?: number[];
  topK?: number;
  filter?: Record<string, unknown>;
}
