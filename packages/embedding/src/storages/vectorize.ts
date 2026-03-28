/**
 * @justwant/embedding — Cloudflare Vectorize storage adapter.
 * Uses binding: index.upsert(), index.query(), index.deleteByIds()
 * Note: Vectorize has one index per binding; indexId is ignored (single index) or
 * can be used as namespace if the binding supports it. We pass indexId for API consistency
 * but Vectorize does not have native multi-index per binding — user typically binds one index.
 */

import { EMBEDDING_CAPABILITY } from "../types.js";
import type { VectorStorage } from "../types.js";

type VectorizeMetadata = Record<string, string | number | boolean>;

export interface VectorizeIndex {
  upsert(
    vectors: Array<{
      id: string;
      values: number[];
      metadata?: VectorizeMetadata;
    }>
  ): Promise<unknown>;
  query(
    vector: number[],
    options?: {
      topK?: number;
      returnMetadata?: "none" | "indexed" | "all";
      returnValues?: boolean;
      filter?: Record<string, unknown>;
    }
  ): Promise<{
    matches: Array<{ id?: string; score?: number; metadata?: Record<string, unknown> }>;
  }>;
  deleteByIds?(ids: string[]): Promise<unknown>;
}

export interface VectorizeStorageAdapterOptions {
  /** Vectorize index binding (env.VECTORIZE_*). */
  vectorize: VectorizeIndex;
  dimension: number;
}

/** Coerce metadata values to Vectorize-supported types (string, number, boolean). */
function toVectorizeMetadata(meta?: Record<string, unknown>): VectorizeMetadata | undefined {
  if (!meta || Object.keys(meta).length === 0) return undefined;
  const out: VectorizeMetadata = {};
  for (const [k, v] of Object.entries(meta)) {
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    } else if (v === null || v === undefined) {
      // skip
    } else if (Array.isArray(v)) {
      out[k] = JSON.stringify(v);
    } else {
      out[k] = JSON.stringify(v);
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Creates a Vectorize storage adapter.
 * User provides the Vectorize index binding.
 */
export function vectorizeStorageAdapter(options: VectorizeStorageAdapterOptions): VectorStorage {
  const { vectorize, dimension } = options;

  return {
    capability: EMBEDDING_CAPABILITY,

    async upsert(
      _indexId: string,
      vectors: Array<{ id: string; vector: number[]; metadata?: Record<string, unknown> }>
    ): Promise<void> {
      for (const v of vectors) {
        if (v.vector.length !== dimension) {
          throw new Error(`Vector dimension ${v.vector.length} does not match ${dimension}`);
        }
      }
      await vectorize.upsert(
        vectors.map((v) => ({
          id: v.id,
          values: v.vector,
          metadata: toVectorizeMetadata(v.metadata),
        }))
      );
    },

    async query(
      _indexId: string,
      vector: number[],
      options?: { topK?: number; filter?: Record<string, unknown>; includeMetadata?: boolean }
    ): Promise<Array<{ id: string; score: number; metadata?: Record<string, unknown> }>> {
      const result = await vectorize.query(vector, {
        topK: options?.topK ?? 10,
        returnMetadata: options?.includeMetadata ? "all" : "none",
        filter: options?.filter as VectorizeMetadata | undefined,
      });
      return result.matches.map((m) => ({
        id: m.id ?? "",
        score: m.score ?? 0,
        ...(m.metadata ? { metadata: m.metadata } : {}),
      }));
    },

    async delete(_indexId: string, ids: string[]): Promise<void> {
      if (vectorize.deleteByIds) {
        await vectorize.deleteByIds(ids);
      }
    },
  };
}
