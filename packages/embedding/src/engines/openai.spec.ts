import { describe, expect, test } from "bun:test";
import { openAiEmbeddingEngine } from "./openai.js";

describe("openAiEmbeddingEngine", () => {
  test("embed calls embeddings.create and returns data[0].embedding", async () => {
    const vec = [0.1, 0.2, 0.3];
    const client = {
      embeddings: {
        create: async (params: { model: string; input: string }) => {
          expect(params.model).toBe("text-embedding-3-small");
          expect(params.input).toBe("hello");
          return { data: [{ embedding: vec }] };
        },
      },
    };
    const engine = openAiEmbeddingEngine({
      client,
      model: "text-embedding-3-small",
    });
    const result = await engine.embed("hello");
    expect(result).toEqual(vec);
  });

  test("embed uses options.model when provided", async () => {
    const client = {
      embeddings: {
        create: async (params: { model: string }) => {
          expect(params.model).toBe("custom-model");
          return { data: [{ embedding: [1, 2, 3] }] };
        },
      },
    };
    const engine = openAiEmbeddingEngine({
      client,
      model: "text-embedding-3-small",
    });
    await engine.embed("x", { model: "custom-model" });
  });

  test("embedMany calls create with input array", async () => {
    const client = {
      embeddings: {
        create: async (params: { input: string[] }) => {
          expect(params.input).toEqual(["a", "b"]);
          return {
            data: [{ embedding: [1, 2] }, { embedding: [3, 4] }],
          };
        },
      },
    };
    const engine = openAiEmbeddingEngine({ client, model: "m" });
    const result = await engine.embedMany?.(["a", "b"]);
    expect(result).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  test("embed throws when no embedding returned", async () => {
    const client = {
      embeddings: {
        create: async () => ({ data: [] }),
      },
    };
    const engine = openAiEmbeddingEngine({ client, model: "m" });
    await expect(engine.embed("x")).rejects.toThrow("no embedding");
  });
});
