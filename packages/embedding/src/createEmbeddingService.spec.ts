import { describe, expect, test } from "bun:test";
import { createEmbeddingService } from "./createEmbeddingService.js";
import { defineEmbeddable as defineEmb } from "./defineEmbeddable.js";
import { defineEmbeddable, defineUniverse } from "./defineUniverse.js";
import { InvalidStorageError, UniverseNotFoundError } from "./errors.js";
import { EMBEDDING_CAPABILITY } from "./types.js";
import type { EmbeddingEngine, VectorStorage } from "./types.js";

function createMockEngine(embedResult: number[] = [0.1, 0.2, 0.3]): EmbeddingEngine {
  return {
    embed: async () => embedResult,
  };
}

function createMockStorage(): VectorStorage & {
  upsertCalls: Array<{ indexId: string; vectors: unknown[] }>;
  queryCalls: Array<{ indexId: string; vector: number[]; options?: unknown }>;
  deleteCalls: Array<{ indexId: string; ids: string[] }>;
} {
  const upsertCalls: Array<{ indexId: string; vectors: unknown[] }> = [];
  const queryCalls: Array<{ indexId: string; vector: number[]; options?: unknown }> = [];
  const deleteCalls: Array<{ indexId: string; ids: string[] }> = [];
  return {
    capability: EMBEDDING_CAPABILITY,
    upsert: async (indexId, vectors) => {
      upsertCalls.push({ indexId, vectors });
    },
    query: async (indexId, vector, options) => {
      queryCalls.push({ indexId, vector, options });
      return [{ id: "1", score: 0.9 }];
    },
    delete: async (indexId, ids) => {
      deleteCalls.push({ indexId, ids });
    },
    upsertCalls,
    queryCalls,
    deleteCalls,
  };
}

const missionUniverse = defineUniverse({
  id: "missions",
  dimension: 768,
  embeddable: defineEmb({
    idField: "missionId",
    toText: (m: { title: string }) => m.title,
    metadataFields: ["type"] as const,
  }),
});

describe("createEmbeddingService", () => {
  test("creates service with valid engine and storage", () => {
    const service = createEmbeddingService({
      engine: createMockEngine(),
      storage: createMockStorage(),
      universes: [missionUniverse],
    });
    expect(service.embed).toBeDefined();
    expect(service.upsertFrom).toBeDefined();
    expect(service.similar).toBeDefined();
    expect(service.delete).toBeDefined();
  });

  test("throws InvalidStorageError when storage lacks capability", () => {
    const badStorage = {
      capability: "other",
      upsert: async () => {},
      query: async () => [] as Array<{ id: string; score: number }>,
    } as unknown as VectorStorage;
    expect(() =>
      createEmbeddingService({
        engine: createMockEngine(),
        storage: badStorage,
        universes: [missionUniverse],
      })
    ).toThrow(InvalidStorageError);
  });

  test("throws InvalidStorageError when storage has no query function", () => {
    const badStorage = {
      capability: EMBEDDING_CAPABILITY,
      upsert: async () => {},
      query: undefined,
    } as unknown as VectorStorage;
    expect(() =>
      createEmbeddingService({
        engine: createMockEngine(),
        storage: badStorage,
        universes: [missionUniverse],
      })
    ).toThrow(InvalidStorageError);
  });

  test("embed delegates to engine", async () => {
    const vec = [0.5, 0.6, 0.7];
    const engine = createMockEngine(vec);
    const service = createEmbeddingService({
      engine,
      storage: createMockStorage(),
      universes: [missionUniverse],
    });
    const result = await service.embed("hello");
    expect(result).toEqual(vec);
  });

  test("upsertFrom calls toText, engine.embed, then storage.upsert", async () => {
    const engine = createMockEngine([1, 2, 3]);
    const storage = createMockStorage();
    const service = createEmbeddingService({
      engine,
      storage,
      universes: [missionUniverse],
    });
    await service.upsertFrom("missions", {
      missionId: "m1",
      title: "Mission Alpha",
      type: "activation",
    });
    expect(storage.upsertCalls).toHaveLength(1);
    expect(storage.upsertCalls[0]?.indexId).toBe("missions");
    expect(storage.upsertCalls[0]?.vectors).toHaveLength(1);
    expect(storage.upsertCalls[0]?.vectors[0]).toMatchObject({
      id: "m1",
      vector: [1, 2, 3],
      metadata: { type: "activation" },
    });
  });

  test("upsertFrom throws UniverseNotFoundError for unknown universe", async () => {
    const service = createEmbeddingService({
      engine: createMockEngine(),
      storage: createMockStorage(),
      universes: [missionUniverse],
    });
    await expect(service.upsertFrom("unknown", { missionId: "1", title: "x" })).rejects.toThrow(
      UniverseNotFoundError
    );
  });

  test("similar with text calls engine.embed then storage.query", async () => {
    const vec = [0.1, 0.2, 0.3];
    const engine = createMockEngine(vec);
    const storage = createMockStorage();
    const service = createEmbeddingService({
      engine,
      storage,
      universes: [missionUniverse],
    });
    const results = await service.similar("missions", { text: "hello", topK: 5 });
    expect(storage.queryCalls).toHaveLength(1);
    expect(storage.queryCalls[0]?.vector).toEqual(vec);
    expect(storage.queryCalls[0]?.options).toMatchObject({ topK: 5 });
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ id: "1", score: 0.9 });
  });

  test("similar with vector calls only storage.query", async () => {
    const vec = [0.9, 0.8, 0.7];
    const engine = createMockEngine([0, 0, 0]);
    const storage = createMockStorage();
    const service = createEmbeddingService({
      engine,
      storage,
      universes: [missionUniverse],
    });
    await service.similar("missions", { vector: vec, topK: 10 });
    expect(storage.queryCalls[0]?.vector).toEqual(vec);
  });

  test("similar throws when neither text nor vector provided", async () => {
    const service = createEmbeddingService({
      engine: createMockEngine(),
      storage: createMockStorage(),
      universes: [missionUniverse],
    });
    await expect(service.similar("missions", {})).rejects.toThrow(
      "similar() requires either text or vector"
    );
  });

  test("similar throws UniverseNotFoundError for unknown universe", async () => {
    const service = createEmbeddingService({
      engine: createMockEngine(),
      storage: createMockStorage(),
      universes: [missionUniverse],
    });
    await expect(service.similar("unknown", { text: "x" })).rejects.toThrow(UniverseNotFoundError);
  });

  test("delete calls storage.delete when present", async () => {
    const storage = createMockStorage();
    const service = createEmbeddingService({
      engine: createMockEngine(),
      storage,
      universes: [missionUniverse],
    });
    await service.delete("missions", ["id1", "id2"]);
    expect(storage.deleteCalls).toHaveLength(1);
    expect(storage.deleteCalls[0]).toEqual({ indexId: "missions", ids: ["id1", "id2"] });
  });

  test("delete does not throw when storage has no delete", async () => {
    const storageNoDelete = createMockStorage();
    (storageNoDelete as { delete?: unknown }).delete = undefined;
    const service = createEmbeddingService({
      engine: createMockEngine(),
      storage: storageNoDelete,
      universes: [missionUniverse],
    });
    await expect(service.delete("missions", ["id1"])).resolves.toBeUndefined();
  });

  test("delete throws UniverseNotFoundError for unknown universe", async () => {
    const service = createEmbeddingService({
      engine: createMockEngine(),
      storage: createMockStorage(),
      universes: [missionUniverse],
    });
    await expect(service.delete("unknown", ["id1"])).rejects.toThrow(UniverseNotFoundError);
  });

  test("upsertFrom throws when idField is missing on item", async () => {
    const service = createEmbeddingService({
      engine: createMockEngine(),
      storage: createMockStorage(),
      universes: [missionUniverse],
    });
    await expect(
      service.upsertFrom("missions", { title: "No missionId", type: "x" } as {
        missionId: string;
        title: string;
      })
    ).rejects.toThrow('Expected string id at "missionId"');
  });

  test("upsertFrom throws when idField is not a string", async () => {
    const service = createEmbeddingService({
      engine: createMockEngine(),
      storage: createMockStorage(),
      universes: [missionUniverse],
    });
    await expect(
      service.upsertFrom("missions", { missionId: 123, title: "x" } as unknown as {
        missionId: string;
        title: string;
      })
    ).rejects.toThrow('Expected string id at "missionId"');
  });

  test("upsertFrom with empty toText result still embeds and upserts", async () => {
    const storage = createMockStorage();
    const universe = defineEmb({
      idField: "missionId",
      toText: () => "",
      metadataFields: [] as const,
    });
    const u = defineUniverse({ id: "missions", dimension: 768, embeddable: universe });
    const service = createEmbeddingService({
      engine: createMockEngine([0.1, 0.2, 0.3]),
      storage,
      universes: [u],
    });
    await service.upsertFrom("missions", { missionId: "m1", title: "x" });
    expect(storage.upsertCalls).toHaveLength(1);
    expect(storage.upsertCalls[0]?.vectors[0]).toMatchObject({ id: "m1", vector: [0.1, 0.2, 0.3] });
  });

  test("similar with topK 0 passes through to storage and returns empty", async () => {
    const storage = createMockStorage();
    storage.query = async (indexId, vector, options) => {
      storage.queryCalls.push({ indexId, vector, options });
      return options?.topK === 0 ? [] : [{ id: "1", score: 0.9 }];
    };
    const service = createEmbeddingService({
      engine: createMockEngine(),
      storage,
      universes: [missionUniverse],
    });
    const results = await service.similar("missions", { text: "x", topK: 0 });
    expect(results).toEqual([]);
    expect(storage.queryCalls[0]?.options).toMatchObject({ topK: 0 });
  });

  test("similar with empty filter passes through to storage", async () => {
    const storage = createMockStorage();
    const service = createEmbeddingService({
      engine: createMockEngine(),
      storage,
      universes: [missionUniverse],
    });
    await service.similar("missions", { text: "x", topK: 5, filter: {} });
    expect(storage.queryCalls[0]?.options).toMatchObject({ filter: {} });
  });

  test("delete with empty ids does not throw when storage has delete", async () => {
    const storage = createMockStorage();
    const service = createEmbeddingService({
      engine: createMockEngine(),
      storage,
      universes: [missionUniverse],
    });
    await expect(service.delete("missions", [])).resolves.toBeUndefined();
    expect(storage.deleteCalls).toHaveLength(1);
    expect(storage.deleteCalls[0]?.ids).toEqual([]);
  });
});
