/**
 * Logique centrale du sandbox : création du service, indexation, requêtes.
 * Retourne les résultats pour validation.
 */

import { createEmbeddingService, defineEmbeddable, defineUniverse } from "../src/index.js";
import { testVectorStorageAdapter } from "../src/storages/memory.js";
import { sqliteVectorStorageAdapter } from "../src/storages/sqlite-vec.js";
import { type Mission, type Profile, missions, profiles } from "./dataset.js";
import { DIMENSION, localTransformersEngine } from "./local-transformers-engine.js";

export type StorageBackend = "sqlite-vec" | "memory";

export interface SandboxResult {
  storageBackend: StorageBackend;
  missionsForP1: Array<{ id: string; score: number }>;
  profilesForM1: Array<{ id: string; score: number }>;
  searchWebReact: Array<{ id: string; score: number }>;
  searchStageDev: Array<{ id: string; score: number }>;
  close?: () => void;
}

const missionUniverse = defineUniverse({
  id: "missions",
  dimension: DIMENSION,
  embeddable: defineEmbeddable({
    idField: "missionId",
    toText: (m: Mission) =>
      [m.title, m.description, m.sector, m.skills?.join(" "), m.cities?.join(" "), m.type]
        .filter(Boolean)
        .join(" "),
    metadataFields: ["sector", "skills", "cities", "companyId", "type"] as const,
  }),
});

const profileUniverse = defineUniverse({
  id: "profiles",
  dimension: DIMENSION,
  embeddable: defineEmbeddable({
    idField: "profileId",
    toText: (p: Profile) =>
      [p.school, p.major, p.skills?.join(" "), p.interests?.join(" "), p.cities?.join(" ")]
        .filter(Boolean)
        .join(" "),
    metadataFields: ["school", "major", "skills", "interests", "cities", "level"] as const,
  }),
});

async function createStorage(): Promise<{
  storage:
    | ReturnType<typeof sqliteVectorStorageAdapter>
    | ReturnType<typeof testVectorStorageAdapter>;
  backend: StorageBackend;
  close?: () => void;
}> {
  try {
    const Database = (await import("better-sqlite3")).default;
    const sqliteVec = await import("sqlite-vec");
    const db = new Database(":memory:");
    sqliteVec.load(db);
    db.exec(`
      CREATE VIRTUAL TABLE vec_emb USING vec0(
        id TEXT PRIMARY KEY,
        index_id TEXT PARTITION KEY,
        embedding FLOAT[${DIMENSION}],
        +metadata TEXT
      )
    `);
    return {
      storage: sqliteVectorStorageAdapter({ db, tableName: "vec_emb", dimension: DIMENSION }),
      backend: "sqlite-vec",
      close: () => db.close(),
    };
  } catch {
    return {
      storage: testVectorStorageAdapter({ dimension: DIMENSION }),
      backend: "memory",
    };
  }
}

export async function runSandbox(verbose = true): Promise<SandboxResult> {
  if (verbose) {
    console.log("1. Chargement du modèle Transformers.js (all-MiniLM-L6-v2)...");
  }
  const engine = await localTransformersEngine();

  const { storage, backend, close } = await createStorage();
  if (verbose) {
    console.log(`2. Stockage : ${backend}`);
  }

  const embedding = createEmbeddingService({
    engine,
    storage,
    universes: [missionUniverse, profileUniverse],
  });

  if (verbose) {
    console.log("3. Indexation des missions et profils...");
  }
  for (const mission of missions) {
    await embedding.upsertFrom("missions", mission);
  }
  for (const profile of profiles) {
    await embedding.upsertFrom("profiles", profile);
  }

  const p1 = profiles.find((p) => p.profileId === "p1");
  const m1 = missions.find((m) => m.missionId === "m1");
  if (!p1 || !m1) throw new Error("p1 or m1 not found in dataset");

  const missionsForP1 = await embedding.similar("missions", {
    text: [p1.school, p1.major, p1.skills.join(" "), p1.interests.join(" ")]
      .filter(Boolean)
      .join(" "),
    topK: 3,
  });

  const profilesForM1 = await embedding.similar("profiles", {
    text: [m1.title, m1.description, m1.skills.join(" ")].filter(Boolean).join(" "),
    topK: 3,
  });

  const searchWebReact = await embedding.similar("missions", {
    text: "développement web React TypeScript Lyon",
    topK: 3,
  });

  const searchStageDev = await embedding.similar("missions", {
    text: "stage développement informatique",
    topK: 5,
  });

  return {
    storageBackend: backend,
    missionsForP1: missionsForP1.map((m) => ({ id: m.id, score: m.score })),
    profilesForM1: profilesForM1.map((p) => ({ id: p.id, score: p.score })),
    searchWebReact: searchWebReact.map((m) => ({ id: m.id, score: m.score })),
    searchStageDev: searchStageDev.map((m) => ({ id: m.id, score: m.score })),
    close,
  };
}
