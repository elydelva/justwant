/**
 * @justwant/embedding — Create embedding service with engine + storage.
 */

import { InvalidStorageError, UniverseNotFoundError } from "./errors.js";
import { EMBEDDING_CAPABILITY } from "./types.js";
import type { CreateEmbeddingServiceOptions, SimilarOptions, Universe } from "./types.js";

export interface EmbeddingService {
  /** Produce a vector from text. Delegates to engine. */
  embed(text: string, options?: { model?: string }): Promise<number[]>;
  /** Upsert a single object: toText → embed → storage.upsert. */
  upsertFrom<T>(universeId: string, item: T): Promise<void>;
  /** Search by text (embed first) or by vector. */
  similar(
    universeId: string,
    options: SimilarOptions
  ): Promise<Array<{ id: string; score: number; metadata?: Record<string, unknown> }>>;
  /** Delete vectors by id. Calls storage.delete if present. */
  delete(universeId: string, ids: string[]): Promise<void>;
}

function getUniverse(universes: Universe[], universeId: string): Universe {
  const u = universes.find((x) => x.id === universeId);
  if (!u) throw new UniverseNotFoundError(universeId);
  return u;
}

function extractId<T>(item: T, idField: string): string {
  const rec = item as Record<string, unknown>;
  const val = rec[idField];
  if (typeof val !== "string") {
    throw new Error(`Expected string id at "${idField}", got ${typeof val}`);
  }
  return val;
}

function extractMetadata<T>(
  item: T,
  fields?: readonly string[]
): Record<string, unknown> | undefined {
  if (!fields?.length) return undefined;
  const rec = item as Record<string, unknown>;
  const meta: Record<string, unknown> = {};
  for (const k of fields) {
    if (k in rec) meta[k] = rec[k];
  }
  return Object.keys(meta).length ? meta : undefined;
}

/**
 * Creates an embedding service with engine and storage.
 * Validates storage capability and query function at creation.
 */
export function createEmbeddingService(options: CreateEmbeddingServiceOptions): EmbeddingService {
  const { engine, storage, universes } = options;

  if (storage.capability !== EMBEDDING_CAPABILITY) {
    throw new InvalidStorageError(
      `storage must have capability "${EMBEDDING_CAPABILITY}", got "${storage.capability}"`
    );
  }
  if (typeof storage.query !== "function") {
    throw new InvalidStorageError("storage must implement query()");
  }

  return {
    async embed(text: string, opts?: { model?: string }) {
      return engine.embed(text, opts);
    },

    async upsertFrom<T>(universeId: string, item: T) {
      const universe = getUniverse(universes, universeId) as Universe<T>;
      const { embeddable } = universe;
      const id = extractId(item, embeddable.idField);
      const text = embeddable.toText(item);
      const vector = await engine.embed(text);
      const metadata = extractMetadata(item, embeddable.metadataFields);
      await storage.upsert(universeId, [{ id, vector, metadata }]);
    },

    async similar(universeId: string, opts: SimilarOptions) {
      getUniverse(universes, universeId);

      let vector: number[];
      if (opts.text !== undefined) {
        vector = await engine.embed(opts.text);
      } else if (opts.vector !== undefined) {
        vector = opts.vector;
      } else {
        throw new Error("similar() requires either text or vector");
      }

      return storage.query(universeId, vector, {
        topK: opts.topK,
        filter: opts.filter,
        includeMetadata: true,
      });
    },

    async delete(universeId: string, ids: string[]) {
      getUniverse(universes, universeId);
      if (storage.delete) {
        await storage.delete(universeId, ids);
      }
    },
  };
}
