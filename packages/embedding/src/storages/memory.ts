/**
 * @justwant/embedding — In-memory vector storage for tests only.
 * Not for production. Use pgvector, sqlite-vec, or vectorize instead.
 */

import { EMBEDDING_CAPABILITY } from "../types.js";
import type { VectorStorage } from "../types.js";

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

interface StoredVector {
  id: string;
  vector: number[];
  metadata?: Record<string, unknown>;
}

export interface TestVectorStorageOptions {
  dimension: number;
}

/**
 * In-memory vector storage for tests only. Not for production.
 */
function matchesFilter(
  metadata: Record<string, unknown>,
  filter: Record<string, unknown>
): boolean {
  for (const [k, v] of Object.entries(filter)) {
    if (metadata[k] !== v) return false;
  }
  return true;
}

export function testVectorStorageAdapter(options: TestVectorStorageOptions): VectorStorage {
  const { dimension } = options;
  const storage = new Map<string, Map<string, StoredVector>>();

  function getIndex(indexId: string): Map<string, StoredVector> {
    let idx = storage.get(indexId);
    if (!idx) {
      idx = new Map();
      storage.set(indexId, idx);
    }
    return idx;
  }

  return {
    capability: EMBEDDING_CAPABILITY,

    async upsert(
      indexId: string,
      vectors: Array<{ id: string; vector: number[]; metadata?: Record<string, unknown> }>
    ): Promise<void> {
      const idx = getIndex(indexId);
      for (const v of vectors) {
        if (v.vector.length !== dimension) {
          throw new Error(
            `Vector dimension ${v.vector.length} does not match storage dimension ${dimension}`
          );
        }
        idx.set(v.id, { id: v.id, vector: v.vector, metadata: v.metadata });
      }
    },

    async query(
      indexId: string,
      vector: number[],
      options?: { topK?: number; filter?: Record<string, unknown>; includeMetadata?: boolean }
    ): Promise<Array<{ id: string; score: number; metadata?: Record<string, unknown> }>> {
      const idx = getIndex(indexId);
      const topK = options?.topK ?? 10;
      const includeMetadata = options?.includeMetadata ?? false;

      const candidates: Array<{ id: string; score: number; metadata?: Record<string, unknown> }> =
        [];
      for (const stored of idx.values()) {
        if (options?.filter && !matchesFilter(stored.metadata ?? {}, options.filter)) continue;
        const score = cosineSimilarity(vector, stored.vector);
        candidates.push({
          id: stored.id,
          score,
          ...(includeMetadata && stored.metadata ? { metadata: stored.metadata } : {}),
        });
      }

      candidates.sort((a, b) => b.score - a.score);
      return candidates.slice(0, topK);
    },

    async delete(indexId: string, ids: string[]): Promise<void> {
      const idx = getIndex(indexId);
      for (const id of ids) {
        idx.delete(id);
      }
    },
  };
}
