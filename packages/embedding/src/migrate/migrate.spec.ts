import { describe, expect, test } from "bun:test";
import { generateMigrations, runMigrations, verifySetup } from "./index.js";

describe("generateMigrations", () => {
  test("pgvector returns extension, table, and optional index", () => {
    const r = generateMigrations({
      dialect: "pgvector",
      tableName: "embeddings",
      dimension: 1536,
    });
    expect(r.extension).toBe("CREATE EXTENSION IF NOT EXISTS vector");
    expect(r.table).toContain('CREATE TABLE IF NOT EXISTS "embeddings"');
    expect(r.table).toContain("embedding vector(1536)");
    expect(r.table).toContain("index_id");
    expect(r.index).toBeUndefined();
  });

  test("pgvector with createIndex adds ivfflat index", () => {
    const r = generateMigrations({
      dialect: "pgvector",
      tableName: "emb",
      dimension: 768,
      createIndex: true,
      ivfflatLists: 50,
    });
    expect(r.index).toContain("ivfflat");
    expect(r.index).toContain("lists = 50");
  });

  test("pgvector with custom indexIdColumn", () => {
    const r = generateMigrations({
      dialect: "pgvector",
      tableName: "vec",
      dimension: 4,
      indexIdColumn: "universe_id",
    });
    expect(r.table).toContain("universe_id");
  });

  test("sqlite-vec returns vec0 virtual table", () => {
    const r = generateMigrations({
      dialect: "sqlite-vec",
      tableName: "vec_emb",
      dimension: 768,
    });
    expect(r.extension).toBeUndefined();
    expect(r.table).toContain('CREATE VIRTUAL TABLE "vec_emb" USING vec0');
    expect(r.table).toContain("embedding FLOAT[768]");
    expect(r.table).toContain("+metadata TEXT");
  });

  test("pgvector minimal options", () => {
    const r = generateMigrations({
      dialect: "pgvector",
      tableName: "x",
      dimension: 1,
    });
    expect(r.table).toContain("vector(1)");
  });
});

describe("verifySetup", () => {
  test("pgvector returns true when table exists", async () => {
    const db = {
      query: async () => ({
        rows: [{ exists: true }],
      }),
    };
    const ok = await verifySetup({
      dialect: "pgvector",
      db,
      tableName: "embeddings",
      dimension: 1536,
    });
    expect(ok).toBe(true);
  });

  test("pgvector returns false when table does not exist", async () => {
    const db = {
      query: async () => ({
        rows: [{ exists: false }],
      }),
    };
    const ok = await verifySetup({
      dialect: "pgvector",
      db,
      tableName: "embeddings",
      dimension: 1536,
    });
    expect(ok).toBe(false);
  });

  test("sqlite-vec returns true when table exists", async () => {
    const db = {
      prepare: () => ({
        get: () => ({ name: "vec_emb" }),
      }),
    };
    const ok = await verifySetup({
      dialect: "sqlite-vec",
      db,
      tableName: "vec_emb",
      dimension: 768,
    });
    expect(ok).toBe(true);
  });

  test("sqlite-vec returns false when table does not exist", async () => {
    const db = {
      prepare: () => ({
        get: () => undefined,
      }),
    };
    const ok = await verifySetup({
      dialect: "sqlite-vec",
      db,
      tableName: "vec_emb",
      dimension: 768,
    });
    expect(ok).toBe(false);
  });
});

describe("runMigrations", () => {
  test("pgvector runs extension and table", async () => {
    const queries: string[] = [];
    const db = {
      query: async (text: string) => {
        queries.push(text);
        return { rows: [] };
      },
    };
    await runMigrations({
      dialect: "pgvector",
      db,
      tableName: "emb_test",
      dimension: 4,
    });
    expect(queries[0]).toContain("CREATE EXTENSION");
    expect(queries[1]).toContain("CREATE TABLE");
  });

  test("sqlite-vec runs virtual table via exec", async () => {
    const executed: string[] = [];
    const db = {
      exec: (sql: string) => {
        executed.push(sql);
      },
    };
    await runMigrations({
      dialect: "sqlite-vec",
      db,
      tableName: "vec_test",
      dimension: 4,
    });
    expect(executed).toHaveLength(1);
    expect(executed[0]).toContain("CREATE VIRTUAL TABLE");
  });

  test("sqlite-vec throws when db has no exec", async () => {
    const db = { prepare: () => ({ get: () => null }) };
    await expect(
      runMigrations({
        dialect: "sqlite-vec",
        db,
        tableName: "vec_test",
        dimension: 4,
      })
    ).rejects.toThrow("requires db.exec()");
  });
});
