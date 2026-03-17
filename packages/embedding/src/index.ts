/**
 * @justwant/embedding — Engine + storage abstraction for embeddings and similarity search.
 */

export { createEmbeddingService } from "./createEmbeddingService.js";
export type { EmbeddingService } from "./createEmbeddingService.js";
export { defineEmbeddable } from "./defineEmbeddable.js";
export type { DefineEmbeddableOptions } from "./defineEmbeddable.js";
export { defineUniverse } from "./defineUniverse.js";
export type { DefineUniverseOptions } from "./defineUniverse.js";
export { EmbeddingError, InvalidStorageError, UniverseNotFoundError } from "./errors.js";
export {
  EMBEDDING_CAPABILITY,
  type CreateEmbeddingServiceOptions,
  type EmbeddingEngine,
  type Embeddable,
  type SimilarOptions,
  type Universe,
  type VectorStorage,
} from "./types.js";
