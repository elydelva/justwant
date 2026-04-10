# @justwant/embedding

Engine + storage abstraction for vector embeddings and semantic similarity search. Define universes, embed objects, query by similarity — backend-agnostic.

## Usage

```ts
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

const embedding = createEmbeddingService({
  engine: cloudflareAiEmbeddingEngine({ ai: env.AI, model: "@cf/baai/bge-base-en-v1.5", dimension: 768 }),
  storage: vectorizeStorageAdapter({ vectorize: env.VECTORIZE_MISSIONS, dimension: 768 }),
  universes: [missionUniverse],
});

await embedding.upsertFrom("missions", mission);
const results = await embedding.similar("missions", { text: "...", topK: 20, filter: { type: "influence" } });
```

## Engines

| Engine | Import | Dep | Key options |
|--------|--------|-----|-------------|
| `openAiEmbeddingEngine` | `engines/openai` | `openai` | `client`, `model`, `dimension?` |
| `cloudflareAiEmbeddingEngine` | `engines/cloudflare-ai` | — (Workers binding) | `ai`, `model?`, `dimension` |
| `testEmbeddingEngine` | `engines/memory` | — | `dimension` |

## Storages

| Storage | Import | Dep | Key options |
|---------|--------|-----|-------------|
| `pgvectorStorageAdapter` | `storages/pgvector` | `pg pgvector` | `db`, `tableName`, `dimension`, `indexIdColumn?` |
| `sqliteVectorStorageAdapter` | `storages/sqlite-vec` | `sqlite-vec better-sqlite3` | `db`, `tableName`, `dimension`, `indexIdColumn?` |
| `vectorizeStorageAdapter` | `storages/vectorize` | — (Workers binding) | `vectorize`, `dimension` |
| `testVectorStorageAdapter` | `storages/memory` | — | `dimension` |

## createEmbeddingService options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `engine` | `EmbeddingEngine` | Yes | Text → vector converter |
| `storage` | `VectorStorage` | Yes | k-NN backend (`capability: "similarity-search"`) |
| `universes` | `Universe[]` | Yes | Named logical indexes with their embeddable config |

## defineEmbeddable options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `idField` | `keyof T` | Yes | Field used as vector id |
| `toText` | `(item: T) => string` | Yes | Reduces the object to embeddable text |
| `metadataFields` | `(keyof T)[]` | No | Fields stored as metadata alongside the vector |

## defineUniverse options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | `string` | Yes | Logical index identifier |
| `dimension` | `number` | Yes | Vector dimension — must match engine and storage |
| `embeddable` | `Embeddable<T>` | Yes | Result of `defineEmbeddable` |

## API

`embed(text, options?)` — delegate to engine  
`upsertFrom(universeId, item)` — embed one object and store its vector  
`upsert(universeId, items)` — batch upsert  
`similar(universeId, { text?, vector?, topK?, filter? })` — k-NN search  
`delete(universeId, ids)` — remove vectors by id (if storage supports it)

## Migrations

```ts
import { generateMigrations, verifySetup, runMigrations } from "@justwant/embedding/migrate";
```
