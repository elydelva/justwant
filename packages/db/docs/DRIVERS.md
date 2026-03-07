# DB Drivers (Waddler)

Pass the driver config to `createDb` for tree-shaking. Import only the driver you need. Connection must be passed explicitly (no `process.env` fallback in drivers).

## Bun SQLite

**Package:** `@justwant/db/bun-sqlite`  
**Peer deps:** waddler (Bun runtime)

```ts
import { createDb } from "@justwant/db/waddler";
import { createBunSqliteAdapter } from "@justwant/db/bun-sqlite";

const db = createDb(createBunSqliteAdapter({ connection: ":memory:" }));
```

| Option | Type | Description |
|--------|------|-------------|
| `connection` | `string` | Path or `:memory:`. Default: `:memory:` |
| `client` | `unknown` | Existing Database |

## PostgreSQL (node-postgres)

**Package:** `@justwant/db/pg`

```ts
const db = createDb(createPgAdapter({ connection: "postgresql://user:pass@localhost/db" }));
```

| Option | Type | Description |
|--------|------|-------------|
| `connection` | `string` | Connection string (required if no client) |
| `client` | `unknown` | Existing pg Pool/Client |

## Neon

**Package:** `@justwant/db/neon`

```ts
const db = createDb(createNeonAdapter({ connection: "postgresql://..." }));
```

## Vercel Postgres, Xata, PGLite, Bun SQL, postgres.js

Same pattern: `{ connection: string }` or `{ client: unknown }`.

## MySQL, PlanetScale, TiDB

```ts
const db = createDb(createMysqlAdapter({ connection: "mysql://..." }));
```

## Turso, D1, Durable Objects, better-sqlite3

- **Turso:** `{ connection: string }` or `{ client: unknown }`
- **D1:** `{ client: unknown }` (required)
- **Durable Objects:** `{ client: unknown }` (required)
- **better-sqlite3:** `{ connection: ":memory:" }` or `{ client: unknown }`

## Mapping

See [@justwant/contract README](../../contract/README.md#mapping-contract-key--column-name). Default: contract key = column name. Use `defaultMapping: "camelToSnake"` or `mapping` to override.
