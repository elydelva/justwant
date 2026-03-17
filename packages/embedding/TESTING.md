# Testing @justwant/embedding

## Unit tests (no external services)

Use **test engine** and **test storage** for fast, deterministic tests. No API keys or databases required.

```ts
import { createEmbeddingService, defineUniverse, defineEmbeddable } from "@justwant/embedding";
import { testEmbeddingEngine } from "@justwant/embedding/engines/memory";
import { testVectorStorageAdapter } from "@justwant/embedding/storages/memory";

const universe = defineUniverse({
  id: "test",
  dimension: 4,
  embeddable: defineEmbeddable({
    idField: "id",
    toText: (x: { text: string }) => x.text,
  }),
});

const embedding = createEmbeddingService({
  engine: testEmbeddingEngine({ dimension: 4 }),
  storage: testVectorStorageAdapter({ dimension: 4 }),
  universes: [universe],
});

await embedding.upsertFrom("test", { id: "1", text: "hello" });
const results = await embedding.similar("test", { text: "hello", topK: 5 });
expect(results[0]?.id).toBe("1");
```

Run all unit and integration tests:

```bash
bun test
```

---

## E2E with sqlite-vec (no API key)

The `sqlite-vec.e2e.spec.ts` test uses **better-sqlite3** + **sqlite-vec**. It is **skipped under Bun** because better-sqlite3 relies on native bindings not yet supported (see [bun#4290](https://github.com/oven-sh/bun/issues/4290)).

To run the sqlite-vec E2E:

```bash
# With Node (better-sqlite3 works)
cd packages/embedding && bun add -d better-sqlite3 sqlite-vec
node --test src/sqlite-vec.e2e.spec.ts
```

Or use `bun test` — the test will be skipped when `process.versions.bun` is defined.

---

## E2E with real SDK (OpenAI, pgvector)

Optional E2E tests in `sdk-e2e.spec.ts` use real APIs. They are **skipped** when credentials are missing.

| Test | Env var(s) |
|------|------------|
| OpenAI embed | `OPENAI_API_KEY` |
| pgvector upsert/query | `POSTGRES_URL` |

**Example:**

```bash
# OpenAI only
OPENAI_API_KEY=sk-xxx bun test packages/embedding

# pgvector (needs Postgres with pgvector extension)
POSTGRES_URL=postgres://user:pass@localhost:5432/db bun test packages/embedding

# Both
OPENAI_API_KEY=sk-xxx POSTGRES_URL=postgres://... bun test packages/embedding
```

The tests use `test.skipIf(!process.env.OPENAI_API_KEY)` and `test.skipIf(!process.env.POSTGRES_URL)` — they are skipped when the env vars are missing.

---

## Test file layout

| File | Purpose |
|------|---------|
| `createEmbeddingService.spec.ts` | Service logic, edge cases, error paths |
| `defineUniverse.spec.ts` | Universe definition |
| `defineEmbeddable.spec.ts` | Embeddable definition |
| `integration.spec.ts` | Full flow with test engine + storage |
| `engines/*.spec.ts` | Engine adapters (mocked SDK) |
| `storages/*.spec.ts` | Storage adapters (mocked DB) |
| `migrate/migrate.spec.ts` | Migration generation, verify, run |
| `sqlite-vec.e2e.spec.ts` | E2E with sqlite-vec (skipped in Bun) |
| `sdk-e2e.spec.ts` | E2E with OpenAI/pgvector (skipped without env) |
