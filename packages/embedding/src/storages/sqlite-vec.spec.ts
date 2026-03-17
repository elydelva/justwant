import { describe, expect, test } from "bun:test";
import { sqliteVectorStorageAdapter } from "./sqlite-vec.js";

describe("sqliteVectorStorageAdapter", () => {
  test("upsert calls prepare and run with vector as Float32Array", async () => {
    const runs: Array<unknown[]> = [];
    const db = {
      prepare: () => ({
        run: (...args: unknown[]) => {
          runs.push(args);
          return {};
        },
        get: () => null,
        all: () => [],
      }),
    };
    const storage = sqliteVectorStorageAdapter({
      db,
      tableName: "vec_emb",
      dimension: 3,
    });
    await storage.upsert("idx", [{ id: "a", vector: [1, 2, 3] }]);
    expect(runs).toHaveLength(1);
    expect(runs[0]?.[0]).toBe("a");
    expect(runs[0]?.[1]).toBe("idx");
    expect(runs[0]?.[2]).toBeInstanceOf(Float32Array);
  });

  test("query calls all with MATCH and k", async () => {
    const allCalls: unknown[][] = [];
    const db = {
      prepare: () => ({
        run: () => ({}),
        get: () => null,
        all: (...args: unknown[]) => {
          allCalls.push(args);
          return [{ id: "1", score: 0.9 }];
        },
      }),
    };
    const storage = sqliteVectorStorageAdapter({
      db,
      tableName: "vec_emb",
      dimension: 3,
    });
    const results = await storage.query("idx", [1, 2, 3], { topK: 5 });
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ id: "1", score: 0.9 });
  });

  test("upsert throws when vector dimension does not match configured dimension", async () => {
    const storage = sqliteVectorStorageAdapter({
      db: {
        prepare: () => ({ run: () => ({}), get: () => null, all: () => [] }),
      },
      tableName: "vec_emb",
      dimension: 3,
    });
    await expect(storage.upsert("idx", [{ id: "a", vector: [1, 2, 3, 4] }])).rejects.toThrow(
      "Vector dimension 4 does not match 3"
    );
  });

  test("delete calls run with ids", async () => {
    const runs: unknown[][] = [];
    const db = {
      prepare: () => ({
        run: (...args: unknown[]) => {
          runs.push(args);
          return {};
        },
        get: () => null,
        all: () => [],
      }),
    };
    const storage = sqliteVectorStorageAdapter({
      db,
      tableName: "vec_emb",
      dimension: 3,
    });
    await storage.delete?.("idx", ["id1", "id2"]);
    expect(runs[0]).toContain("idx");
    expect(runs[0]).toContain("id1");
    expect(runs[0]).toContain("id2");
  });
});
