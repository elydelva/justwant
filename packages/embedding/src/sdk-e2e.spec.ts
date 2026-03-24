/**
 * Optional E2E with real OpenAI and Postgres. Skipped when credentials are not set.
 * Set OPENAI_API_KEY and/or POSTGRES_URL to run.
 */

import { describe, expect, test } from "bun:test";
import { openAiEmbeddingEngine } from "./engines/openai.js";
import { createEmbeddingService, defineEmbeddable, defineUniverse } from "./index.js";
import { pgvectorStorageAdapter } from "./storages/pgvector.js";

const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
const hasPostgres = Boolean(process.env.POSTGRES_URL);

describe("SDK E2E (module)", () => {
  test("createEmbeddingService is importable", async () => {
    const { createEmbeddingService } = await import("./index.js");
    expect(typeof createEmbeddingService).toBe("function");
  });
});

describe("SDK E2E (OpenAI engine)", () => {
  test.skipIf(!hasOpenAI)("embed returns vector from real OpenAI API", async () => {
    const { default: OpenAI } = await import("openai");
    const engine = openAiEmbeddingEngine({
      client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
      model: "text-embedding-3-small",
      dimension: 1536,
    });
    const vec = await engine.embed("hello world");
    expect(Array.isArray(vec)).toBe(true);
    expect(vec.length).toBe(1536);
  });
});

describe("SDK E2E (pgvector storage)", () => {
  test.skipIf(!hasPostgres)("upsert and query with real Postgres + pgvector", async () => {
    const { default: pg } = await import("pg");
    const pool = new pg.Pool({ connectionString: process.env.POSTGRES_URL });

    const db = {
      query: async (text: string, values?: unknown[]) => {
        const res = await pool.query(text, values as unknown[]);
        return { rows: res.rows };
      },
    };

    await db.query("CREATE EXTENSION IF NOT EXISTS vector");
    await db.query(`
        CREATE TABLE IF NOT EXISTS embedding_e2e_test (
          id TEXT NOT NULL,
          index_id TEXT NOT NULL,
          embedding vector(4) NOT NULL,
          metadata jsonb,
          PRIMARY KEY (id, index_id)
        )
      `);

    const universe = defineUniverse({
      id: "test",
      dimension: 4,
      embeddable: defineEmbeddable({
        idField: "id",
        toText: (x: { text: string }) => x.text,
      }),
    });

    const storage = pgvectorStorageAdapter({
      db,
      tableName: "embedding_e2e_test",
      dimension: 4,
    });

    const embedding = createEmbeddingService({
      engine: { embed: async () => [1, 0, 0, 0] },
      storage,
      universes: [universe],
    });

    await embedding.upsertFrom("test", { id: "e2e-1", text: "hello" });
    const results = await embedding.similar("test", {
      vector: [1, 0, 0, 0],
      topK: 5,
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0]?.id).toBe("e2e-1");

    await db.query("DROP TABLE IF EXISTS embedding_e2e_test");
    await pool.end();
  });
});
