/**
 * @justwant/embedding — sqlite-vec storage adapter.
 * Requires sqlite-vec loaded on the connection. Uses vec0 virtual table.
 * Table schema: id TEXT, index_id TEXT partition key, embedding FLOAT[dimension], +metadata TEXT.
 * User must create the vec0 table. See README for schema.
 */

import { EMBEDDING_CAPABILITY } from "../types.js";
import type { VectorStorage } from "../types.js";

export interface SqliteDatabase {
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
  exec?(sql: string): void;
}

export interface SqliteVectorStorageAdapterOptions {
  /** SQLite database with sqlite-vec loaded. */
  db: SqliteDatabase;
  /** vec0 table name. */
  tableName: string;
  dimension: number;
  /** Column for logical index (universe id). Default "index_id". */
  indexIdColumn?: string;
}

/**
 * Creates a sqlite-vec storage adapter.
 * Requires: sqliteVec.load(db) and CREATE VIRTUAL TABLE vec_xxx USING vec0(...).
 * Schema: id TEXT PRIMARY KEY, index_id TEXT PARTITION KEY, embedding FLOAT[dimension], +metadata TEXT
 */
export function sqliteVectorStorageAdapter(
  options: SqliteVectorStorageAdapterOptions
): VectorStorage {
  const { db, tableName, dimension, indexIdColumn = "index_id" } = options;

  return {
    capability: EMBEDDING_CAPABILITY,

    async upsert(
      indexId: string,
      vectors: Array<{ id: string; vector: number[]; metadata?: Record<string, unknown> }>
    ): Promise<void> {
      const stmt = db.prepare(
        `INSERT INTO ${tableName} (id, ${indexIdColumn}, embedding, metadata) VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET embedding = excluded.embedding, metadata = excluded.metadata`
      );
      for (const v of vectors) {
        if (v.vector.length !== dimension) {
          throw new Error(`Vector dimension ${v.vector.length} does not match ${dimension}`);
        }
        const embedding = new Float32Array(v.vector);
        const meta = v.metadata ? JSON.stringify(v.metadata) : null;
        stmt.run(v.id, indexId, embedding, meta);
      }
    },

    async query(
      indexId: string,
      vector: number[],
      options?: { topK?: number; filter?: Record<string, unknown>; includeMetadata?: boolean }
    ): Promise<Array<{ id: string; score: number; metadata?: Record<string, unknown> }>> {
      const topK = options?.topK ?? 10;
      const embedding = new Float32Array(vector);
      const metaSelect = options?.includeMetadata ? ", metadata" : "";
      const rows = db
        .prepare(
          `SELECT id, (1 - distance) as score${metaSelect}
         FROM ${tableName}
         WHERE embedding MATCH ? AND k = ? AND ${indexIdColumn} = ?`
        )
        .all(embedding, topK, indexId) as Array<{ id: string; score: number; metadata?: string }>;

      return rows.map((r) => ({
        id: r.id,
        score: r.score,
        ...(options?.includeMetadata && r.metadata
          ? { metadata: JSON.parse(r.metadata) as Record<string, unknown> }
          : {}),
      }));
    },

    async delete(indexId: string, ids: string[]): Promise<void> {
      if (ids.length === 0) return;
      const placeholders = ids.map(() => "?").join(", ");
      db.prepare(
        `DELETE FROM ${tableName} WHERE ${indexIdColumn} = ? AND id IN (${placeholders})`
      ).run(indexId, ...ids);
    },
  };
}
