import { describe, expect, test } from "bun:test";
import { testVectorStorageAdapter } from "./memory.js";

describe("testVectorStorageAdapter", () => {
  test("has capability similarity-search", () => {
    const storage = testVectorStorageAdapter({ dimension: 3 });
    expect(storage.capability).toBe("similarity-search");
  });

  test("upsert then query returns vectors by similarity", async () => {
    const storage = testVectorStorageAdapter({ dimension: 3 });
    await storage.upsert("idx", [
      { id: "a", vector: [1, 0, 0] },
      { id: "b", vector: [0.9, 0.1, 0] },
      { id: "c", vector: [0, 0, 1] },
    ]);
    const results = await storage.query("idx", [1, 0, 0], { topK: 2 });
    expect(results).toHaveLength(2);
    expect(results[0]?.id).toBe("a");
    expect(results[0]?.score).toBeCloseTo(1, 5);
    expect(results[1]?.id).toBe("b");
  });

  test("query returns topK results", async () => {
    const storage = testVectorStorageAdapter({ dimension: 2 });
    await storage.upsert("idx", [
      { id: "1", vector: [1, 0] },
      { id: "2", vector: [0, 1] },
      { id: "3", vector: [0.5, 0.5] },
    ]);
    const results = await storage.query("idx", [1, 0], { topK: 1 });
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("1");
  });

  test("delete removes ids", async () => {
    const storage = testVectorStorageAdapter({ dimension: 2 });
    await storage.upsert("idx", [
      { id: "x", vector: [1, 0] },
      { id: "y", vector: [0, 1] },
    ]);
    await storage.delete("idx", ["x"]);
    const results = await storage.query("idx", [1, 0], { topK: 5 });
    expect(results.map((r) => r.id)).not.toContain("x");
    expect(results.map((r) => r.id)).toContain("y");
  });

  test("query with filter returns only matching vectors", async () => {
    const storage = testVectorStorageAdapter({ dimension: 2 });
    await storage.upsert("idx", [
      { id: "1", vector: [1, 0], metadata: { type: "a" } },
      { id: "2", vector: [1, 0], metadata: { type: "b" } },
    ]);
    const results = await storage.query("idx", [1, 0], {
      topK: 5,
      filter: { type: "a" },
    });
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("1");
  });

  test("upsert overwrites existing id", async () => {
    const storage = testVectorStorageAdapter({ dimension: 2 });
    await storage.upsert("idx", [{ id: "1", vector: [1, 0] }]);
    await storage.upsert("idx", [{ id: "1", vector: [0, 1] }]);
    const results = await storage.query("idx", [0, 1], { topK: 1 });
    expect(results[0]?.id).toBe("1");
    expect(results[0]?.score).toBeCloseTo(1, 5);
  });
});
