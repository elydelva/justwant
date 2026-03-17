/**
 * @justwant/embedding — Cloudflare Workers AI embedding engine.
 * Uses env.AI binding: ai.run(model, { text: string | string[] }) → { data: number[][] }
 */

import type { EmbeddingEngine } from "../types.js";

export interface CloudflareAiBinding {
  run(model: string, opts: { text: string | string[] }): Promise<{ data: number[][] }>;
}

export interface CloudflareAiEmbeddingEngineOptions {
  /** Cloudflare AI binding (env.AI). */
  ai: CloudflareAiBinding;
  /** Model id, e.g. @cf/baai/bge-base-en-v1.5 (768 dims). */
  model?: string;
  dimension: number;
}

const DEFAULT_MODEL = "@cf/baai/bge-base-en-v1.5";

/**
 * Creates a Cloudflare AI embedding engine.
 * User provides the AI binding (env.AI from wrangler).
 */
export function cloudflareAiEmbeddingEngine(
  options: CloudflareAiEmbeddingEngineOptions
): EmbeddingEngine {
  const { ai, model = DEFAULT_MODEL, dimension } = options;

  return {
    async embed(text: string): Promise<number[]> {
      const { data } = await ai.run(model, { text: [text] });
      const vec = data[0];
      if (!vec || vec.length !== dimension) {
        throw new Error(
          `Cloudflare AI returned vector of length ${vec?.length ?? 0}, expected ${dimension}`
        );
      }
      return vec;
    },
    async embedMany(texts: string[]): Promise<number[][]> {
      const { data } = await ai.run(model, { text: texts });
      if (data.length !== texts.length) {
        throw new Error(`Cloudflare AI returned ${data.length} vectors, expected ${texts.length}`);
      }
      for (const vec of data) {
        if (vec.length !== dimension) {
          throw new Error(
            `Cloudflare AI returned vector of length ${vec.length}, expected ${dimension}`
          );
        }
      }
      return data;
    },
  };
}
