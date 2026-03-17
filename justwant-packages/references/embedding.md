# @justwant/embedding

Engine + storage abstraction for embeddings and similarity search. Declare universes, embed objects, query by similarity—regardless of backend.

> **Implémenté** : `packages/embedding`. README : `packages/embedding/README.md`. Sandbox : `packages/embedding/sandbox/`. Ce document décrit le concept, les exemples, les limites et les opportunités.

---

## 1. Concept en quelques lignes

**@justwant/embedding** fournit une couche d’abstraction pour :

1. **Déclarer un univers d’objets** : types d’entités à représenter en vecteurs (missions, BDE, produits, etc.), avec une règle pour produire le texte (ou les chunks) à embarquer.
2. **Faire de la similarité indépendamment du backend** : `embed()`, `upsert()`, `query()` (ou `similar()`) avec la même API, que le stockage soit Cloudflare Vectorize, Pinecone, pgvector, OpenAI + Qdrant, etc.
3. **Storage via adapter** : l’utilisateur injecte le SDK / binding concret (ex. binding Vectorize + binding AI Cloudflare) dans l’adapter ; le package ne dépend d’aucun fournisseur.

Le package ne contient **pas** de client OpenAI/Pinecone/Vectorize : il définit des **contrats** (interfaces) que les adapters implémentent en s’appuyant sur le SDK fourni par l’app.

### Pas de @justwant/contract ni de @justwant/db

- **@justwant/contract** : non utilisé. Les univers/embeddables ne sont pas des entités définies avec `defineContract` et les champs `@justwant/contract/fields`. Ce sont des configs (réduction objet → texte, métadonnées). Les types des objets embarqués (Mission, BDE, etc.) restent du ressort de l’app.
- **@justwant/db** : non utilisé. Les providers (adapters) sont des backends **vecteurs / similarité** (Vectorize, Pinecone, pgvector, etc.), pas la couche DAL relationnelle de `@justwant/db`. Même avec pgvector, l’adapter parle au moteur vectoriel (requêtes par vecteur, upsert de vecteurs), pas aux tables métier via le contrat db.

En résumé : **ni contract ni db** ; les providers d’embedding n’ont rien à voir avec ces packages — ils sont dédiés à l’embedding et à la recherche par similarité.

### 1.1 Schéma engine + storage (comment ça fonctionne)

Il y a **deux rôles logiques** :

| Rôle | Responsabilité | Exemples (SDK fourni par l’app) |
|------|----------------|----------------------------------|
| **Embedding engine** | Texte → vecteur (`embed(text)`) | Cloudflare AI, OpenAI Embeddings, Cohere, modèle local |
| **Vector storage** | Stocker les vecteurs + recherche par similarité (`upsert`, `query`) | Vectorize, Pinecone, pgvector, Qdrant |

**Choix retenu : engine et stockage vectoriel sont dissociés définitivement.** On passe toujours **engine** + **storage** à `createEmbeddingService`. Pas d’adapter unique qui mélange les deux (ou alors construit en interne à partir d’un engine + d’un storage).

Pour **passer le schéma engine + storage**, l’API pourrait ressembler à ceci :

```ts
// Contrats séparés
export interface EmbeddingEngine {
  /** Texte → vecteur. Dimension cohérente avec les univers. */
  embed(text: string, options?: { model?: string }): Promise<number[]>;
  embedMany?(texts: string[]): Promise<number[][]>;
}

export interface VectorStorage {
  readonly capability: "similarity-search";
  upsert(
    indexId: string,
    vectors: Array<{ id: string; vector: number[]; metadata?: Record<string, unknown> }>
  ): Promise<void>;
  query(
    indexId: string,
    vector: number[],
    options?: { topK?: number; filter?: Record<string, unknown>; includeMetadata?: boolean }
  ): Promise<Array<{ id: string; score: number; metadata?: Record<string, unknown> }>>;
  delete?(indexId: string, ids: string[]): Promise<void>;
}

// Création du service avec engine + storage
const embedding = createEmbeddingService({
  engine: openAiEmbeddingEngine({ client: openai, model: "text-embedding-3-small" }),
  storage: pgvectorStorageAdapter({ db, tableName: "embeddings", dimension: 1536 }),
  universes: [missionUniverse, bdeUniverse],
});

// Comportement interne du service :
// - embed(text)           → engine.embed(text)
// - upsertFrom(universeId, item) → toText(item) → engine.embed() → storage.upsert()
// - similar(universeId, { text }) → engine.embed(text) → storage.query(...)
// - similar(universeId, { vector }) → storage.query(...) directement
```

**Règles :**

- `createEmbeddingService` accepte **uniquement** `{ engine, storage, universes }`.
- **Seul le storage** a `capability: 'similarity-search'` ; l’engine n’a pas cette capability.
- La **dimension** doit être cohérente entre univers, engine et storage. Le service peut la vérifier au démarrage.

**Adapters possibles pour chaque rôle :** voir le tableau en §2.5 et les exemples Cloudflare, SQLite, Vercel, pgvector.

---

## 2. Exemples de concept

### 2.1 Déclarer un univers et utiliser le service

```ts
import { createEmbeddingService, defineUniverse, defineEmbeddable } from "@justwant/embedding";
import { cloudflareAiEmbeddingEngine } from "@justwant/embedding/engines/cloudflare-ai";
import { vectorizeStorageAdapter } from "@justwant/embedding/storages/vectorize";

const missionUniverse = defineUniverse({
  id: "missions",
  dimension: 768,
  embeddable: defineEmbeddable({
    idField: "missionId",
    toText: (item) =>
      [item.type, item.title, item.description, item.sector].filter(Boolean).join(" "),
    metadataFields: ["type", "cities", "schoolIds"] as const,
  }),
});

const bdeUniverse = defineUniverse({
  id: "bdes",
  dimension: 768,
  embeddable: defineEmbeddable({
    idField: "bdeOrgId",
    toText: (item) =>
      [item.bdeType, item.description, item.schoolName, item.city, item.skillsOfMembers].filter(Boolean).join(" "),
    metadataFields: ["schoolId", "city"] as const,
  }),
});

const embedding = createEmbeddingService({
  engine: cloudflareAiEmbeddingEngine({ ai: env.AI, model: "@cf/baai/bge-base-en-v1.5", dimension: 768 }),
  storage: vectorizeStorageAdapter({ vectorize: env.VECTORIZE_MISSIONS, dimension: 768 }),
  universes: [missionUniverse, bdeUniverse],
});

await embedding.upsertFrom("missions", {
  missionId: "01HXYZ...",
  type: "activation",
  title: "Opération campus Lyon",
  description: "...",
  sector: "Tech",
  cities: ["Lyon"],
  schoolIds: ["school-1"],
});

const results = await embedding.similar("missions", {
  text: "mission influence étudiants Lyon",
  topK: 20,
  filter: { type: "influence", cities: "Lyon" },
});
// → [{ id: "01HXYZ...", score: 0.92, metadata? }, ...]
```

### 2.2 Engine et storage Cloudflare (bindings fournis par l’utilisateur)

L’utilisateur fournit `env.AI` et `env.VECTORIZE_*`. Le package expose deux factories séparées.

```ts
// engines/cloudflare-ai.ts
export function cloudflareAiEmbeddingEngine(options: { ai: AiBinding; model?: string; dimension: number }): EmbeddingEngine {
  const { ai, model = "@cf/baai/bge-base-en-v1.5" } = options;
  return {
    async embed(text: string) {
      const { data } = await ai.run(model, { text: [text] });
      return data[0];
    },
  };
}

// storages/vectorize.ts
export function vectorizeStorageAdapter(options: { vectorize: VectorizeIndex; dimension: number }): VectorStorage {
  const { vectorize } = options;
  return {
    capability: "similarity-search",
    async upsert(indexId, vectors) {
      await vectorize.upsert(vectors.map((v) => ({ id: v.id, values: v.vector, metadata: v.metadata ?? {} })));
    },
    async query(indexId, vector, opts) {
      const res = await vectorize.query(vector, { topK: opts?.topK ?? 10, filter: opts?.filter });
      return res.matches.map((m) => ({ id: m.id!, score: m.score ?? 0, metadata: m.metadata }));
    },
  };
}
```

### 2.3 Engine + storage "test" “memory” pour tests

```ts
import { testEmbeddingEngine } from "@justwant/embedding/engines/memory";
import { testVectorStorageAdapter } from "@justwant/embedding/storages/memory";

const embedding = createEmbeddingService({
  engine: testEmbeddingEngine({ dimension: 768 }),
  storage: testVectorStorageAdapter({ dimension: 768 }),
  universes: [missionUniverse],
});
```

### 2.4 Intégration dans le worker matching (Kaampus)

```ts
// workers/matching/src/lib/embedding.ts
import { createEmbeddingService, defineUniverse, defineEmbeddable } from "@justwant/embedding";
import { cloudflareAiEmbeddingEngine } from "@justwant/embedding/engines/cloudflare-ai";
import { vectorizeStorageAdapter } from "@justwant/embedding/storages/vectorize";

const missionUniverse = defineUniverse({ /* ... */ });
const bdeUniverse = defineUniverse({ /* ... */ });

export const embeddingService = createEmbeddingService({
  engine: cloudflareAiEmbeddingEngine({ ai: env.AI, model: "@cf/baai/bge-base-en-v1.5", dimension: 768 }),
  storage: vectorizeStorageAdapter({ vectorize: env.VECTORIZE_MISSIONS, dimension: 768 }),
  universes: [missionUniverse, bdeUniverse],
});

await embeddingService.upsertFrom("missions", mission);
const similar = await embeddingService.similar("missions", { vector: bdeVector, topK: 50 });
```

### 2.5 Exemples engine + storage (Cloudflare, SQLite, Vercel, pgvector)

Engine et storage sont **toujours** passés séparément. Exemples avec quatre stacks.

---

#### Cloudflare (Worker) — engine CF AI + storage Vectorize

```ts
// Worker CF : bindings env.AI + env.VECTORIZE_MISSIONS
import { createEmbeddingService, defineUniverse, defineEmbeddable } from "@justwant/embedding";
import { cloudflareAiEmbeddingEngine } from "@justwant/embedding/engines/cloudflare-ai";
import { vectorizeStorageAdapter } from "@justwant/embedding/storages/vectorize";

const missionUniverse = defineUniverse({
  id: "missions",
  dimension: 768,
  embeddable: defineEmbeddable({
    idField: "missionId",
    toText: (m) => [m.type, m.title, m.description].filter(Boolean).join(" "),
    metadataFields: ["type", "cities"] as const,
  }),
});

export const embedding = createEmbeddingService({
  engine: cloudflareAiEmbeddingEngine({
    ai: env.AI,
    model: "@cf/baai/bge-base-en-v1.5",
    dimension: 768,
  }),
  storage: vectorizeStorageAdapter({
    vectorize: env.VECTORIZE_MISSIONS,
    dimension: 768,
  }),
  universes: [missionUniverse],
});

// Usage identique quel que soit la stack
await embedding.upsertFrom("missions", mission);
const results = await embedding.similar("missions", { text: "mission influence Lyon", topK: 20 });
```

---

#### SQLite — engine CF AI ou OpenAI + storage SQLite (sqlite-vec)

Pour du dev local ou un petit déploiement avec SQLite (better-sqlite3 + extension [sqlite-vec](https://github.com/asg017/sqlite-vec) ou table manuelle avec colonne vector en JSON).

```ts
// Node ou Bun : SQLite comme stockage vectoriel
import { createEmbeddingService, defineUniverse, defineEmbeddable } from "@justwant/embedding";
import { cloudflareAiEmbeddingEngine } from "@justwant/embedding/engines/cloudflare-ai";
// ou openAiEmbeddingEngine si en Node avec OPENAI_API_KEY
import { sqliteVectorStorageAdapter } from "@justwant/embedding/storages/sqlite-vec";

import Database from "better-sqlite3";
const db = new Database("app.sqlite");

// Option A : engine Cloudflare AI (si tu as un proxy ou un Worker qui expose l’embed)
const engine = cloudflareAiEmbeddingEngine({
  ai: fakeAiBinding, // ou fetch vers ton Worker CF
  model: "@cf/baai/bge-base-en-v1.5",
  dimension: 768,
});

// Option B : engine OpenAI (Node)
// const engine = openAiEmbeddingEngine({ client: new OpenAI(), model: "text-embedding-3-small", dimension: 1536 });

const embedding = createEmbeddingService({
  engine,
  storage: sqliteVectorStorageAdapter({
    db,
    tableName: "mission_embeddings",
    dimension: 768,
    indexIdColumn: "universe_id", // un index par univers (missions, bdes, …)
  }),
  universes: [missionUniverse],
});
```

Le storage SQLite implémente `VectorStorage` : `upsert` insère/met à jour les lignes (id, vector, metadata), `query` fait un k-NN via sqlite-vec ou une requête cosine en app si pas d’extension.

---

#### Vercel — engine Vercel AI / OpenAI + storage pgvector (Vercel Postgres)

Sur Vercel, embedding souvent via Vercel AI SDK ou OpenAI, et le stockage vectoriel via Vercel Postgres avec l’extension pgvector.

```ts
// Vercel (Next.js API route ou serverless)
import { createEmbeddingService, defineUniverse, defineEmbeddable } from "@justwant/embedding";
import { openAiEmbeddingEngine } from "@justwant/embedding/engines/openai";
import { pgvectorStorageAdapter } from "@justwant/embedding/storages/pgvector";
import { sql } from "@vercel/postgres"; // ou tout client pg compatible

const missionUniverse = defineUniverse({
  id: "missions",
  dimension: 1536,
  embeddable: defineEmbeddable({
    idField: "missionId",
    toText: (m) => [m.type, m.title, m.description].filter(Boolean).join(" "),
    metadataFields: ["type", "cities"] as const,
  }),
});

const embedding = createEmbeddingService({
  engine: openAiEmbeddingEngine({
    client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
    model: "text-embedding-3-small",
    dimension: 1536,
  }),
  storage: pgvectorStorageAdapter({
    db: sql,
    tableName: "embeddings",
    dimension: 1536,
    indexIdColumn: "universe_id",
  }),
  universes: [missionUniverse],
});

await embedding.upsertFrom("missions", mission);
const results = await embedding.similar("missions", { text: "mission influence Lyon", topK: 20 });
```

---

#### pgvector seul (Postgres quelconque)

Même idée : n’importe quel engine + pgvector comme storage. Utile pour Vercel Postgres, Supabase, Neon, ou un Postgres self‑hosted.

```ts
import { createEmbeddingService, defineUniverse, defineEmbeddable } from "@justwant/embedding";
import { openAiEmbeddingEngine } from "@justwant/embedding/engines/openai";
import { pgvectorStorageAdapter } from "@justwant/embedding/storages/pgvector";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

const embedding = createEmbeddingService({
  engine: openAiEmbeddingEngine({
    client: new OpenAI(),
    model: "text-embedding-3-small",
    dimension: 1536,
  }),
  storage: pgvectorStorageAdapter({
    db: client, // ou db selon ce que l’adapter attend (raw client vs Drizzle)
    tableName: "doc_vectors",
    dimension: 1536,
    indexIdColumn: "index_id",
  }),
  universes: [missionUniverse, bdeUniverse],
});
```

---

**Récap des combinaisons**

| Stack        | Engine                          | Storage                          |
|-------------|----------------------------------|----------------------------------|
| **Cloudflare** | `cloudflareAiEmbeddingEngine({ ai, model, dimension })` | `vectorizeStorageAdapter({ vectorize, dimension })` |
| **SQLite**     | `cloudflareAiEmbeddingEngine` ou `openAiEmbeddingEngine` | `sqliteVectorStorageAdapter({ db, tableName, dimension })` |
| **Vercel**     | `openAiEmbeddingEngine({ client, model, dimension })`   | `pgvectorStorageAdapter({ db, tableName, dimension })` (Vercel Postgres) |
| **pgvector**  | n’importe quel engine           | `pgvectorStorageAdapter({ db, tableName, dimension })` |

---

## 3. Contrat (interface) côté package

Engine et storage sont deux contrats distincts. L’utilisateur fournit les SDK (AI, Vectorize, Postgres, etc.).

### 3.1 EmbeddingEngine (texte → vecteur)

Pas de capability. Responsabilité unique : produire un vecteur à partir d’un texte.

```ts
export interface EmbeddingEngine {
  /** Texte → vecteur. Dimension cohérente avec les univers. */
  embed(text: string, options?: { model?: string }): Promise<number[]>;
  embedMany?(texts: string[]): Promise<number[][]>;
}
```

### 3.2 VectorStorage (stockage + similarité)

Seul le storage porte la capability `'similarity-search'`. C’est lui qui est « limité » aux backends faisant bien du k-NN.

```ts
export const EMBEDDING_CAPABILITY = "similarity-search" as const;

export interface VectorStorage {
  readonly capability: typeof EMBEDDING_CAPABILITY;

  upsert(
    indexId: string,
    vectors: Array<{ id: string; vector: number[]; metadata?: Record<string, unknown> }>
  ): Promise<void>;

  query(
    indexId: string,
    vector: number[],
    options?: { topK?: number; filter?: Record<string, unknown>; includeMetadata?: boolean }
  ): Promise<Array<{ id: string; score: number; metadata?: Record<string, unknown> }>>;

  delete?(indexId: string, ids: string[]): Promise<void>;
}
```

### 3.3 Vérification au démarrage

Dans `createEmbeddingService({ engine, storage, universes })` : vérifier que `storage.capability === 'similarity-search'` et que `typeof storage.query === 'function'`. Optionnellement vérifier la cohérence des dimensions (engine / storage / universes).

---

## 4. Limites

| Limite | Explication |
|--------|-------------|
| **Pas d’embedding côté package** | Le package ne contient aucun modèle ni appel API. Tout passe par l’adapter (SDK fourni par l’utilisateur). |
| **Dimension fixe par univers** | Chaque univers déclare une dimension (ex. 768). Changer de modèle = nouveau déploiement / index. |
| **Filtres dépendants de l’adapter** | Le `filter` dans `query()` n’est pas standardisé (Vectorize a son propre format, Pinecone aussi). L’API peut accepter `Record<string, unknown>` et laisser l’adapter interpréter ou ignorer. |
| **Pas de gestion des index** | Création/suppression d’index (Vectorize, Pinecone) reste à la charge de l’utilisateur (wrangler, dashboard, script). Le package suppose que l’index existe. |
| **Similarité = une métrique** | On expose une recherche “similar” générique. Les réglages avancés (métrique exacte, prefilter, hybrid search) sont spécifiques à l’adapter. |
| **Pas de chunking automatique** | Si l’app veut faire du chunking (longs documents), elle le fait en amont ; le package traite “un objet → un (ou N) textes → N vecteurs” si on étend `defineEmbeddable` (ex. `toChunks()). |

---

## 5. Opportunités

| Opportunité | Description |
|-------------|-------------|
| **Swap de backend sans changer le code métier** | Remplacer Vectorize par Pinecone ou pgvector = changer l’adapter + config ; les univers et les appels `upsert` / `similar` restent identiques. |
| **Tests et dev sans coût** | Adapter test (ou “mock”) pour tests et dev local sans compte Cloudflare/Pinecone. |
| **Alignement avec cache, storage, notify** | Même pattern : `createX({ adapter, ... })`, adapters dans des subpaths, SDK fourni par l’app. |
| **Réutilisation dans d’autres produits** | Tout produit qui a besoin de “recherche par similarité” (reco, search sémantique, matching) peut réutiliser le même package. |
| **Évolution vers chunking / multi-vector** | `defineEmbeddable` pourrait supporter `toChunks(): string[]` et un mode “one id, many vectors” si les backends le permettent. |
| **Plugins possibles** | Cache des embeddings (éviter de recalculer le même texte), audit (log des queries), normalisation de scores. |

---

## 6. Ce qu’on peut supporter (SDK fourni par l’app)

Engine et storage sont fournis séparément ; l’utilisateur injecte le SDK pour chacun.

| Engine (texte → vecteur) | Ce que l’app fournit | Storage (vecteurs + similarité) | Ce que l’app fournit |
|--------------------------|----------------------|---------------------------------|----------------------|
| **Cloudflare AI** | `env.AI`, model, dimension | **Vectorize** | `env.VECTORIZE_*`, dimension |
| **OpenAI** | `OpenAI` client, model, dimension | **pgvector** | Client Postgres, tableName, dimension |
| **Vercel AI** | Config Vercel AI / OpenAI | **pgvector** (Vercel Postgres) | `@vercel/postgres` ou client pg, tableName |
| **Test** (mock) | dimension | **SQLite (sqlite-vec)** | `better-sqlite3`, tableName, dimension |
| **Test** (mock) | dimension | **Test** (mock) | dimension (pour tests) |

Combinaisons libres : par ex. Cloudflare AI + Vectorize, OpenAI + pgvector, Cloudflare AI + SQLite (dev), etc.

---

## 7. Migration (pgvector, sqlite-vec)

Le package expose `@justwant/embedding/migrate` pour :

- **generateMigrations** — génère le SQL (extension, table, index optionnel)
- **verifySetup** — vérifie que la table existe
- **runMigrations** — exécute les migrations (idempotent, IF NOT EXISTS)

Inspiré de `@justwant/db` (DDL, exist) et `@justwant/contract` (schémas déclaratifs).

## 8. API proposée (résumé)

| Export | Rôle |
|--------|------|
| `createEmbeddingService({ engine, storage, universes })` | Service principal. Engine + storage obligatoirement séparés. |
| `defineUniverse({ id, dimension, embeddable })` | Déclare un type d’objet (index logique) et comment l’embarquer. |
| `defineEmbeddable({ idField, toText, metadataFields? })` | Décrit la réduction objet → texte et les métadonnées à stocker. |
| **Engines** : `EmbeddingEngine`, `cloudflareAiEmbeddingEngine`, `openAiEmbeddingEngine`, `testEmbeddingEngine` | Texte → vecteur. |
| **Storages** : `VectorStorage`, `vectorizeStorageAdapter`, `pgvectorStorageAdapter`, `sqliteVectorStorageAdapter` | Stockage + similarité (capability `'similarity-search'`). |
| Subpaths : `@justwant/embedding/engines/cloudflare-ai`, `engines/openai`, `engines/memory`, `storages/vectorize`, `storages/pgvector`, `storages/sqlite-vec`, `migrate` | Implémentations fournies par le package ; l’utilisateur injecte le SDK (binding, client, db). |

**Méthodes du service :**

- `embed(text, options?)` → délègue à `adapter.embed()`.
- `upsert(universeId, items)` → pour chaque item, `toText(item)` → `embed()` → `adapter.upsert()`.
- `upsertFrom(universeId, item)` → cas courant : un objet, un vecteur.
- `similar(universeId, { text?, vector?, topK?, filter? })` → si `text`, appelle `embed(text)` puis `adapter.query()` ; si `vector`, appelle directement `adapter.query()`.
- `delete(universeId, ids)` → si l’adapter expose `delete`, le rappeler.

---

## 8. Référence croisée

- **Cahier des charges Kaampus** : section 10 (Matching IA — Vectorize), worker `matching`, table `mission_matches`.
- **Patterns** : `@justwant/cache` (adapter + plugins), `@justwant/storage` (sources/adapters), `@justwant/notify` (canaux + adapters par canal).

---

*Document de concept — Mars 2026. À faire évoluer en README + référence officielle si le package est implémenté.*
