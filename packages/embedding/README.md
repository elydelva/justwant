# @justwant/embedding

Engine + storage abstraction for embeddings and similarity search. Declare universes of objects, embed them, and query by similarity—regardless of backend (Cloudflare, OpenAI, pgvector, SQLite, etc.).

## Installation

```bash
bun add @justwant/embedding
# or
pnpm add @justwant/embedding
```

For optional engines/storages: `openai` (OpenAI), `pgvector` (Postgres), `sqlite-vec` + `better-sqlite3` (SQLite).

---

## Usage

### Engine + storage (always separate)

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

await embedding.upsertFrom("missions", mission);
const results = await embedding.similar("missions", { text: "mission influence Lyon", topK: 20 });
```

---

## Engines

| Engine | Import | Runtime |
|--------|--------|---------|
| `testEmbeddingEngine` | `@justwant/embedding/engines/memory` | Tests only |
| `cloudflareAiEmbeddingEngine` | `@justwant/embedding/engines/cloudflare-ai` | Cloudflare Workers |
| `openAiEmbeddingEngine` | `@justwant/embedding/engines/openai` | Node, Bun |

---

## Storages

| Storage | Import | Runtime |
|---------|--------|---------|
| `testVectorStorageAdapter` | `@justwant/embedding/storages/memory` | Tests only |
| `vectorizeStorageAdapter` | `@justwant/embedding/storages/vectorize` | Cloudflare Workers |
| `pgvectorStorageAdapter` | `@justwant/embedding/storages/pgvector` | Postgres + pgvector |
| `sqliteVectorStorageAdapter` | `@justwant/embedding/storages/sqlite-vec` | SQLite + sqlite-vec |

---

## Examples

### Cloudflare (Worker)

```ts
import { cloudflareAiEmbeddingEngine } from "@justwant/embedding/engines/cloudflare-ai";
import { vectorizeStorageAdapter } from "@justwant/embedding/storages/vectorize";

const embedding = createEmbeddingService({
  engine: cloudflareAiEmbeddingEngine({ ai: env.AI, model: "@cf/baai/bge-base-en-v1.5", dimension: 768 }),
  storage: vectorizeStorageAdapter({ vectorize: env.VECTORIZE_MISSIONS, dimension: 768 }),
  universes: [missionUniverse],
});
```

### SQLite (sqlite-vec)

```ts
import * as sqliteVec from "sqlite-vec";
import Database from "better-sqlite3";
import { testEmbeddingEngine } from "@justwant/embedding/engines/memory";
import { sqliteVectorStorageAdapter } from "@justwant/embedding/storages/sqlite-vec";

const db = new Database(":memory:");
sqliteVec.load(db);
db.exec(`
  CREATE VIRTUAL TABLE vec_emb USING vec0(
    id TEXT PRIMARY KEY,
    index_id TEXT PARTITION KEY,
    embedding FLOAT[768],
    +metadata TEXT
  )
`);

const embedding = createEmbeddingService({
  engine: testEmbeddingEngine({ dimension: 768 }),
  storage: sqliteVectorStorageAdapter({ db, tableName: "vec_emb", dimension: 768 }),
  universes: [missionUniverse],
});
```

### Vercel + pgvector

```ts
import { openAiEmbeddingEngine } from "@justwant/embedding/engines/openai";
import { pgvectorStorageAdapter } from "@justwant/embedding/storages/pgvector";
import { sql } from "@vercel/postgres";
import OpenAI from "openai";

const embedding = createEmbeddingService({
  engine: openAiEmbeddingEngine({
    client: new OpenAI(),
    model: "text-embedding-3-small",
    dimension: 1536,
  }),
  storage: pgvectorStorageAdapter({
    db: sql,
    tableName: "embeddings",
    dimension: 1536,
  }),
  universes: [missionUniverse],
});
```

---

## Migration & table setup

**Vectorize** (Cloudflare) does not need migrations — indexes are created via Wrangler or the dashboard. For **pgvector** and **sqlite-vec**, you must create the vector tables before using the storage adapters. Use `@justwant/embedding/migrate` to generate, verify, and run migrations.

### pgvector

1. Enable the extension: `CREATE EXTENSION IF NOT EXISTS vector;`
2. Create a table with columns: `id`, `index_id` (or your `indexIdColumn`), `embedding vector(N)`, `metadata jsonb`.

```sql
CREATE TABLE IF NOT EXISTS embeddings (
  id TEXT NOT NULL,
  index_id TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata jsonb,
  PRIMARY KEY (id, index_id)
);

CREATE INDEX IF NOT EXISTS idx_embeddings_index_id ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

Replace `1536` with your model dimension (e.g. 768 for BGE).

### sqlite-vec

1. Load the extension: `sqliteVec.load(db);`
2. Create a virtual table using `vec0`:

```sql
CREATE VIRTUAL TABLE vec_embeddings USING vec0(
  id TEXT PRIMARY KEY,
  index_id TEXT PARTITION KEY,
  embedding FLOAT[1536],
  +metadata TEXT
);
```

Replace `1536` with your dimension.

### Automated migration

```ts
import { generateMigrations, verifySetup, runMigrations } from "@justwant/embedding/migrate";

// Generate SQL (returns { extension?, table, index? })
const { extension, table, index } = generateMigrations({
  dialect: "pgvector",
  tableName: "embeddings",
  dimension: 1536,
  indexIdColumn: "index_id",
  createIndex: true,
});

// Verify tables exist
const ok = await verifySetup({
  dialect: "pgvector",
  db: yourPgClient,
  tableName: "embeddings",
  dimension: 1536,
});

// Run migrations (creates extension, table, index if missing)
await runMigrations({
  dialect: "pgvector",
  db: yourPgClient,
  tableName: "embeddings",
  dimension: 1536,
  createIndex: true,
});
```

---

## API

- `createEmbeddingService({ engine, storage, universes })` — create service
- `embed(text)` — text → vector
- `upsertFrom(universeId, item)` — embed item and store
- `similar(universeId, { text?, vector?, topK?, filter? })` — similarity search
- `delete(universeId, ids)` — delete vectors

**Filter format** is adapter-specific: Vectorize uses its own metadata filter syntax, pgvector/sqlite-vec use metadata JSON. The test storage filters by exact match on metadata keys. See each adapter’s docs for details.

---

## Testing

See [TESTING.md](./TESTING.md) for unit tests, E2E with sqlite-vec (no API key), and optional SDK E2E (OpenAI, pgvector).

---

## License

MIT
