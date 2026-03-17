import { describe, expect, test } from "bun:test";
import { vectorizeStorageAdapter } from "./vectorize.js";

describe("vectorizeStorageAdapter", () => {
  test("upsert calls index.upsert with correct format", async () => {
    const upsertCalls: unknown[] = [];
    const vectorize = {
      upsert: async (v: unknown) => {
        upsertCalls.push(v);
      },
      query: async () => ({ matches: [] }),
    };
    const storage = vectorizeStorageAdapter({ vectorize, dimension: 3 });
    await storage.upsert("idx", [{ id: "a", vector: [1, 2, 3], metadata: { type: "x" } }]);
    expect(upsertCalls).toHaveLength(1);
    expect(upsertCalls[0]).toEqual([{ id: "a", values: [1, 2, 3], metadata: { type: "x" } }]);
  });

  test("query calls index.query with topK and returnMetadata", async () => {
    const queryCalls: Array<{ vector: number[]; options?: unknown }> = [];
    const vectorize = {
      upsert: async () => {},
      query: async (vector: number[], options?: unknown) => {
        queryCalls.push({ vector, options });
        return { matches: [{ id: "1", score: 0.9 }] };
      },
    };
    const storage = vectorizeStorageAdapter({ vectorize, dimension: 3 });
    await storage.query("idx", [1, 2, 3], { topK: 5, includeMetadata: true });
    expect(queryCalls[0]?.options).toMatchObject({
      topK: 5,
      returnMetadata: "all",
    });
  });

  test("query passes filter to index.query", async () => {
    const queryCalls: Array<{ options?: { filter?: unknown } }> = [];
    const vectorize = {
      upsert: async () => {},
      query: async (_v: number[], options?: { filter?: unknown }) => {
        queryCalls.push({ options });
        return { matches: [] };
      },
    };
    const storage = vectorizeStorageAdapter({ vectorize, dimension: 3 });
    await storage.query("idx", [1, 2, 3], { filter: { type: "a" } });
    expect(queryCalls[0]?.options?.filter).toEqual({ type: "a" });
  });

  test("delete calls deleteByIds when present", async () => {
    const deleteCalls: string[][] = [];
    const vectorize = {
      upsert: async () => {},
      query: async () => ({ matches: [] }),
      deleteByIds: async (ids: string[]) => {
        deleteCalls.push(ids);
      },
    };
    const storage = vectorizeStorageAdapter({ vectorize, dimension: 3 });
    await storage.delete?.("idx", ["id1", "id2"]);
    expect(deleteCalls).toEqual([["id1", "id2"]]);
  });
});
