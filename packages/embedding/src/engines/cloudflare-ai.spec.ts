import { describe, expect, test } from "bun:test";
import { cloudflareAiEmbeddingEngine } from "./cloudflare-ai.js";

describe("cloudflareAiEmbeddingEngine", () => {
  test("embed calls ai.run with model and text array", async () => {
    const vec = [0.1, 0.2, 0.3];
    const ai = {
      run: async (model: string, opts: { text: string | string[] }) => {
        expect(model).toBe("@cf/baai/bge-base-en-v1.5");
        expect(opts.text).toEqual(["hello"]);
        return { data: [vec] };
      },
    };
    const engine = cloudflareAiEmbeddingEngine({
      ai,
      model: "@cf/baai/bge-base-en-v1.5",
      dimension: 3,
    });
    const result = await engine.embed("hello");
    expect(result).toEqual(vec);
  });

  test("embed uses custom model when provided", async () => {
    const ai = {
      run: async (model: string) => {
        expect(model).toBe("custom-model");
        return { data: [[1, 2, 3]] };
      },
    };
    const engine = cloudflareAiEmbeddingEngine({
      ai,
      model: "custom-model",
      dimension: 3,
    });
    await engine.embed("x");
  });

  test("embedMany calls ai.run with text array", async () => {
    const ai = {
      run: async (_model: string, opts: { text: string | string[] }) => {
        expect(opts.text).toEqual(["a", "b"]);
        return {
          data: [
            [1, 2],
            [3, 4],
          ],
        };
      },
    };
    const engine = cloudflareAiEmbeddingEngine({ ai, dimension: 2 });
    const result = await engine.embedMany?.(["a", "b"]);
    expect(result).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  test("embed throws when dimension mismatch", async () => {
    const ai = {
      run: async () => ({ data: [[1, 2]] }),
    };
    const engine = cloudflareAiEmbeddingEngine({ ai, dimension: 3 });
    await expect(engine.embed("x")).rejects.toThrow("expected 3");
  });
});
