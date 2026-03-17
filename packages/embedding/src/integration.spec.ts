import { describe, expect, test } from "bun:test";
import { testEmbeddingEngine } from "./engines/memory.js";
import { createEmbeddingService, defineEmbeddable, defineUniverse } from "./index.js";
import { testVectorStorageAdapter } from "./storages/memory.js";

describe("integration (memory engine + test storage)", () => {
  const missionUniverse = defineUniverse({
    id: "missions",
    dimension: 4,
    embeddable: defineEmbeddable({
      idField: "missionId",
      toText: (m: { title: string }) => m.title,
      metadataFields: ["type"] as const,
    }),
  });

  test("full flow: upsertFrom then similar returns matching results", async () => {
    const embedding = createEmbeddingService({
      engine: testEmbeddingEngine({ dimension: 4 }),
      storage: testVectorStorageAdapter({ dimension: 4 }),
      universes: [missionUniverse],
    });

    await embedding.upsertFrom("missions", {
      missionId: "m1",
      title: "Mission Alpha",
      type: "activation",
    });
    await embedding.upsertFrom("missions", {
      missionId: "m2",
      title: "Mission Beta",
      type: "influence",
    });

    const results = await embedding.similar("missions", {
      text: "Mission Alpha",
      topK: 2,
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0]?.id).toBe("m1");
    expect(results[0]?.score).toBeGreaterThanOrEqual(0.9);
  });

  test("similar with vector works without embedding", async () => {
    const embedding = createEmbeddingService({
      engine: testEmbeddingEngine({ dimension: 4 }),
      storage: testVectorStorageAdapter({ dimension: 4 }),
      universes: [missionUniverse],
    });

    await embedding.upsertFrom("missions", {
      missionId: "m1",
      title: "Mission Alpha",
      type: "activation",
    });

    const vec = await embedding.embed("Mission Alpha");
    const results = await embedding.similar("missions", { vector: vec, topK: 1 });
    expect(results[0]?.id).toBe("m1");
  });

  test("multiple universes are isolated by index_id", async () => {
    const missions = defineUniverse({
      id: "missions",
      dimension: 4,
      embeddable: defineEmbeddable({
        idField: "missionId",
        toText: (m: { title: string }) => m.title,
      }),
    });
    const bdes = defineUniverse({
      id: "bdes",
      dimension: 4,
      embeddable: defineEmbeddable({
        idField: "bdeId",
        toText: (b: { name: string }) => b.name,
      }),
    });

    const embedding = createEmbeddingService({
      engine: testEmbeddingEngine({ dimension: 4 }),
      storage: testVectorStorageAdapter({ dimension: 4 }),
      universes: [missions, bdes],
    });

    await embedding.upsertFrom("missions", { missionId: "m1", title: "Mission Alpha" });
    await embedding.upsertFrom("bdes", { bdeId: "b1", name: "BDE Lyon" });

    const missionResults = await embedding.similar("missions", {
      text: "Mission Alpha",
      topK: 2,
    });
    const bdeResults = await embedding.similar("bdes", {
      text: "BDE Lyon",
      topK: 2,
    });

    expect(missionResults[0]?.id).toBe("m1");
    expect(bdeResults[0]?.id).toBe("b1");
    expect(missionResults.map((r) => r.id)).not.toContain("b1");
    expect(bdeResults.map((r) => r.id)).not.toContain("m1");
  });
});
