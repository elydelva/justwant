/**
 * @justwant/embedding — OpenAI Embeddings engine.
 * Uses OpenAI client: client.embeddings.create({ model, input }) → { data: [{ embedding }] }
 */

import type { EmbeddingEngine } from "../types.js";

export interface OpenAiEmbeddingsClient {
  create(params: {
    model: string;
    input: string | string[];
    dimensions?: number;
  }): Promise<{ data: Array<{ embedding: number[] }> }>;
}

export interface OpenAiEmbeddingEngineOptions {
  /** OpenAI client with embeddings API. */
  client: { embeddings: OpenAiEmbeddingsClient };
  /** Model id, e.g. text-embedding-3-small (1536 dims). */
  model: string;
  dimension?: number;
}

/**
 * Creates an OpenAI embedding engine.
 * User provides the OpenAI client instance.
 */
export function openAiEmbeddingEngine(options: OpenAiEmbeddingEngineOptions): EmbeddingEngine {
  const { client, model, dimension } = options;

  return {
    async embed(text: string, opts?: { model?: string }): Promise<number[]> {
      const m = opts?.model ?? model;
      const res = await client.embeddings.create({
        model: m,
        input: text,
        ...(dimension ? { dimensions: dimension } : {}),
      });
      const vec = res.data[0]?.embedding;
      if (!vec) throw new Error("OpenAI returned no embedding");
      return vec;
    },
    async embedMany(texts: string[]): Promise<number[][]> {
      const res = await client.embeddings.create({
        model,
        input: texts,
        ...(dimension ? { dimensions: dimension } : {}),
      });
      return res.data.map((d) => d.embedding);
    },
  };
}
