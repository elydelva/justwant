/**
 * @justwant/embedding — pgvector storage adapter.
 * Uses Postgres client with pgvector extension.
 * Table schema: id TEXT, index_id TEXT, embedding vector(N), metadata JSONB.
 * User must create table and run CREATE EXTENSION vector.
 */

import { EMBEDDING_CAPABILITY } from "../types.js";
import type { VectorStorage } from "../types.js";

export interface PgVectorClient {
  query(text: string, values?: unknown[]): Promise<{ rows: Array<Record<string, unknown>> }>;
}

export interface PgvectorStorageAdapterOptions {
  /** Postgres client (pg Client or Pool). */
  db: PgVectorClient;
  /** Table name. */
  tableName: string;
  dimension: number;
  /** Column for logical index (universe id). Default "index_id". */
  indexIdColumn?: string;
  /** Optional: function to format vector for SQL. Default uses pgvector.toSql if available. */
  formatVector?: (vector: number[]) => string;
}

function defaultFormatVector(vector: number[]): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pgvector = require("pgvector/pg");
    return pgvector.toSql(vector);
  } catch {
    return `[${vector.join(",")}]`;
  }
}

/**
 * Creates a pgvector storage adapter.
 * Expects table with columns: id, index_id (or indexIdColumn), embedding vector(dimension), metadata jsonb.
 */
export function pgvectorStorageAdapter(options: PgvectorStorageAdapterOptions): VectorStorage {
  const {
    db,
    tableName,
    dimension,
    indexIdColumn = "index_id",
    formatVector = defaultFormatVector,
  } = options;

  return {
    capability: EMBEDDING_CAPABILITY,

    async upsert(
      indexId: string,
      vectors: Array<{ id: string; vector: number[]; metadata?: Record<string, unknown> }>
    ): Promise<void> {
      for (const v of vectors) {
        if (v.vector.length !== dimension) {
          throw new Error(`Vector dimension ${v.vector.length} does not match ${dimension}`);
        }
      }
      for (const v of vectors) {
        const vecStr = formatVector(v.vector);
        const meta = v.metadata ? JSON.stringify(v.metadata) : null;
        await db.query(
          `INSERT INTO ${tableName} (id, ${indexIdColumn}, embedding, metadata)
           VALUES ($1, $2, $3::vector, $4::jsonb)
           ON CONFLICT (id, ${indexIdColumn}) DO UPDATE SET embedding = $3::vector, metadata = $4::jsonb`,
          [v.id, indexId, vecStr, meta]
        );
      }
    },

    async query(
      indexId: string,
      vector: number[],
      options?: { topK?: number; filter?: Record<string, unknown>; includeMetadata?: boolean }
    ): Promise<Array<{ id: string; score: number; metadata?: Record<string, unknown> }>> {
      const topK = options?.topK ?? 10;
      const vecStr = formatVector(vector);
      const metaSelect = options?.includeMetadata ? ", metadata" : "";
      const metaCol = options?.includeMetadata ? "metadata" : "NULL::jsonb as metadata";

      const res = await db.query(
        `SELECT id, (1 - (embedding <=> $1::vector)) as score${metaSelect}
         FROM ${tableName}
         WHERE ${indexIdColumn} = $2
         ORDER BY embedding <=> $1::vector
         LIMIT $3`,
        [vecStr, indexId, topK]
      );

      return res.rows.map((r) => ({
        id: String(r.id),
        score: Number(r.score),
        ...(options?.includeMetadata && r.metadata
          ? { metadata: r.metadata as Record<string, unknown> }
          : {}),
      }));
    },

    async delete(indexId: string, ids: string[]): Promise<void> {
      if (ids.length === 0) return;
      const placeholders = ids.map((_, i) => `$${i + 2}`).join(", ");
      await db.query(
        `DELETE FROM ${tableName} WHERE ${indexIdColumn} = $1 AND id IN (${placeholders})`,
        [indexId, ...ids]
      );
    },
  };
}
