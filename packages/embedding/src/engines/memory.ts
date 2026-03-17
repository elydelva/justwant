/**
 * @justwant/embedding — Embedding engine for tests only.
 * Produces deterministic vectors from text (hash-based). Not for production.
 */

import type { EmbeddingEngine } from "../types.js";

/** Simple string hash to produce deterministic "random" numbers. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h = h & h;
  }
  return Math.abs(h);
}

export interface TestEmbeddingEngineOptions {
  dimension: number;
}

/**
 * Creates an embedding engine for tests only. Vectors are deterministic from text.
 * Not for production — use openAiEmbeddingEngine or cloudflareAiEmbeddingEngine.
 */
export function testEmbeddingEngine(options: TestEmbeddingEngineOptions): EmbeddingEngine {
  const { dimension } = options;

  const embed = async (text: string): Promise<number[]> => {
    const vec: number[] = [];
    for (let i = 0; i < dimension; i++) {
      const h = hashString(`${text}:${i}`);
      vec.push((h % 1000) / 1000);
    }
    return vec;
  };

  return {
    embed,
    async embedMany(texts: string[]): Promise<number[][]> {
      return Promise.all(texts.map(embed));
    },
  };
}
