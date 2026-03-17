import { describe, expect, test } from "bun:test";
import { pgvectorStorageAdapter } from "./pgvector.js";

describe("pgvectorStorageAdapter", () => {
  test("upsert executes INSERT with vector format", async () => {
    const queries: Array<{ text: string; values?: unknown[] }> = [];
    const db = {
      query: async (text: string, values?: unknown[]) => {
        queries.push({ text, values });
        return { rows: [] };
      },
    };
    const storage = pgvectorStorageAdapter({
      db,
      tableName: "embeddings",
      dimension: 3,
      formatVector: (v) => `[${v.join(",")}]`,
    });
    await storage.upsert("idx", [{ id: "a", vector: [1, 2, 3], metadata: { x: 1 } }]);
    expect(queries[0]?.text).toContain("INSERT INTO embeddings");
    expect(queries[0]?.values?.[0]).toBe("a");
    expect(queries[0]?.values?.[1]).toBe("idx");
    expect(queries[0]?.values?.[2]).toBe("[1,2,3]");
  });

  test("query executes SELECT with cosine distance", async () => {
    const db = {
      query: async (text: string, values?: unknown[]) => {
        expect(text).toContain("embedding <=>");
        expect(text).toContain("LIMIT");
        return {
          rows: [{ id: "1", score: 0.9 }],
        };
      },
    };
    const storage = pgvectorStorageAdapter({
      db,
      tableName: "emb",
      dimension: 3,
      formatVector: (v) => `[${v.join(",")}]`,
    });
    const results = await storage.query("idx", [1, 2, 3], { topK: 5 });
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ id: "1", score: 0.9 });
  });

  test("upsert throws when vector dimension does not match configured dimension", async () => {
    const storage = pgvectorStorageAdapter({
      db: { query: async () => ({ rows: [] }) },
      tableName: "emb",
      dimension: 3,
    });
    await expect(storage.upsert("idx", [{ id: "a", vector: [1, 2, 3, 4] }])).rejects.toThrow(
      "Vector dimension 4 does not match 3"
    );
  });

  test("delete executes DELETE with ids", async () => {
    const queries: Array<{ values?: unknown[] }> = [];
    const db = {
      query: async (_t: string, values?: unknown[]) => {
        queries.push({ values });
        return { rows: [] };
      },
    };
    const storage = pgvectorStorageAdapter({
      db,
      tableName: "emb",
      dimension: 3,
    });
    await storage.delete?.("idx", ["id1", "id2"]);
    expect(queries[0]?.values).toEqual(["idx", "id1", "id2"]);
  });
});
