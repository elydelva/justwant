import { describe, expect, test } from "bun:test";
import { testEmbeddingEngine } from "./memory.js";

describe("testEmbeddingEngine", () => {
  test("embed returns vector of correct dimension", async () => {
    const engine = testEmbeddingEngine({ dimension: 768 });
    const vec = await engine.embed("hello");
    expect(vec).toHaveLength(768);
    expect(vec.every((x) => typeof x === "number" && x >= 0 && x <= 1)).toBe(true);
  });

  test("embed returns deterministic vector for same text", async () => {
    const engine = testEmbeddingEngine({ dimension: 4 });
    const v1 = await engine.embed("same");
    const v2 = await engine.embed("same");
    expect(v1).toEqual(v2);
  });

  test("embed returns different vectors for different text", async () => {
    const engine = testEmbeddingEngine({ dimension: 4 });
    const v1 = await engine.embed("hello");
    const v2 = await engine.embed("world");
    expect(v1).not.toEqual(v2);
  });

  test("embedMany returns array of vectors", async () => {
    const engine = testEmbeddingEngine({ dimension: 4 });
    const vecs = await engine.embedMany?.(["a", "b", "c"]);
    expect(vecs).toHaveLength(3);
    expect(vecs[0]).toHaveLength(4);
    expect(vecs[1]).toHaveLength(4);
    expect(vecs[2]).toHaveLength(4);
  });
});
