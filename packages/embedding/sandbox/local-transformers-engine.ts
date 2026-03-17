/**
 * Moteur d'embedding local via @xenova/transformers.
 * Modèle : Xenova/all-MiniLM-L6-v2 (384 dimensions).
 */

import type { EmbeddingEngine } from "../src/types.js";

export const DIMENSION = 384;
const MODEL = "Xenova/all-MiniLM-L6-v2";

let extractor: Awaited<ReturnType<typeof import("@xenova/transformers").pipeline>> | null = null;

async function getExtractor() {
  if (!extractor) {
    const { pipeline } = await import("@xenova/transformers");
    extractor = await pipeline("feature-extraction", MODEL, {
      quantized: true,
      progress_callback: (p: { status?: string }) => {
        if (p.status) process.stdout.write(`\r  ${p.status}`);
      },
    });
    process.stdout.write("\n");
  }
  return extractor;
}

/**
 * Crée un EmbeddingEngine utilisant Transformers.js (all-MiniLM-L6-v2).
 * Dimension : 384.
 */
export async function localTransformersEngine(): Promise<EmbeddingEngine> {
  const ext = await getExtractor();

  const embed = async (text: string): Promise<number[]> => {
    const output = await ext(text, { pooling: "mean", normalize: true });
    const data = output.data;
    return Array.from(data instanceof Float32Array ? data : (data as number[]));
  };

  return {
    embed,
    async embedMany(texts: string[]): Promise<number[][]> {
      return Promise.all(texts.map(embed));
    },
  };
}
