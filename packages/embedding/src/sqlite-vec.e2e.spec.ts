/**
 * E2E with sqlite-vec + better-sqlite3. No API key required.
 * Skipped in Bun (better-sqlite3 uses native bindings, see bun#4290).
 * Run with Node for full E2E: node --test or bun test (uses skipIf).
 */

import { describe, expect, test } from "bun:test";
import { testEmbeddingEngine } from "./engines/memory.js";
import { createEmbeddingService, defineEmbeddable, defineUniverse } from "./index.js";
import { sqliteVectorStorageAdapter } from "./storages/sqlite-vec.js";

// better-sqlite3 is not supported in Bun
const hasSqliteVec = typeof process !== "undefined" && process.versions?.bun === undefined;

describe("sqlite-vec E2E (module)", () => {
  test("sqliteVectorStorageAdapter is importable", async () => {
    const { sqliteVectorStorageAdapter } = await import("./storages/sqlite-vec.js");
    expect(typeof sqliteVectorStorageAdapter).toBe("function");
  });
});

describe("sqlite-vec E2E (test engine + sqlite-vec storage)", () => {
  test.skipIf(!hasSqliteVec)(
    "full flow: upsertFrom then similar returns matching results",
    async () => {
      const { default: Database } = await import("better-sqlite3");
      const sqliteVec = await import("sqlite-vec");
      const db = new Database(":memory:");
      sqliteVec.load(db);
      db.exec(`
        CREATE VIRTUAL TABLE vec_emb USING vec0(
          id TEXT PRIMARY KEY,
          index_id TEXT PARTITION KEY,
          embedding FLOAT[4],
          +metadata TEXT
        )
      `);

      const universe = defineUniverse({
        id: "missions",
        dimension: 4,
        embeddable: defineEmbeddable({
          idField: "missionId",
          toText: (m: { title: string }) => m.title,
          metadataFields: ["type"] as const,
        }),
      });

      const embedding = createEmbeddingService({
        engine: testEmbeddingEngine({ dimension: 4 }),
        storage: sqliteVectorStorageAdapter({
          db,
          tableName: "vec_emb",
          dimension: 4,
        }),
        universes: [universe],
      });

      await embedding.upsertFrom("missions", {
        missionId: "m1",
        title: "Mission Alpha",
        type: "activation",
      });
      await embedding.upsertFrom("missions", {
        missionId: "m2",
        title: "Mission Beta",
        type: "influence",
      });

      const results = await embedding.similar("missions", {
        text: "Mission Alpha",
        topK: 2,
      });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0]?.id).toBe("m1");
      expect(results[0]?.score).toBeGreaterThanOrEqual(0.9);
    }
  );
});
