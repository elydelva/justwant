# @justwant/db

Contract-first Data Access Layer. Uniform `MappedTable` interface over Drizzle, Prisma, and Waddler.

## Install

```bash
bun add @justwant/db
# + ORM peer dep: drizzle-orm | @prisma/client | waddler
```

## Three-step setup

1. Define a contract (`@justwant/contract`)
2. Create an adapter
3. Define a table with a field mapping

```ts
// 1. Contract
import { defineContract, field } from "@justwant/contract";
const userContract = defineContract({
  id: field.string(),
  email: field.string(),
  createdAt: field.string(),
  deletedAt: field.string().optional(),
});

// 2. Adapter (pick one)
import { createDrizzleAdapter } from "@justwant/db/drizzle";
import { createPrismaAdapter } from "@justwant/db/prisma";
import { createDb } from "@justwant/db/waddler";

// 3. Table
const users = adapter.defineTable(source, userContract, mapping);
```

## MappedTable methods

| Method | Signature | Notes |
|--------|-----------|-------|
| `create` | `(data: CreateInput) => Promise<T>` | `id`, `createdAt`, `updatedAt` auto-omitted from input |
| `findById` | `(id: string) => Promise<T \| null>` | |
| `findOne` | `(where: Partial<T>) => Promise<T \| null>` | |
| `findMany` | `(where: Partial<T>) => Promise<T[]>` | |
| `update` | `(id, data: Partial<T>) => Promise<T>` | |
| `delete` | `(id) => Promise<void>` | Soft delete — sets `deletedAt` |
| `hardDelete` | `(id) => Promise<void>` | Removes row permanently |
| `createSafe` | `(data) => Promise<ValidateResult<T>>` | Waddler only |
| `updateSafe` | `(id, data) => Promise<ValidateResult<T>>` | Waddler only |
| `createTable` | `() => Promise<void>` | Waddler only — DDL |
| `exist` | `() => Promise<boolean>` | Waddler only |
| `drop` | `() => Promise<void>` | Waddler only |

Soft delete: rows with non-null `deletedAt` are excluded from all `find*` queries.

## Drizzle adapter

```ts
import { createDrizzleAdapter } from "@justwant/db/drizzle";
import { defineMappedTable } from "@justwant/db/drizzle/defineMappedTable";

const adapter = createDrizzleAdapter(drizzle(sqlite), { dialect: "sqlite" });
const users = adapter.defineTable(usersTable, userContract, {
  id: usersTable.id,
  email: usersTable.email,
  // ...
});
```

### createDrizzleAdapter options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dialect` | `"pg" \| "mysql" \| "sqlite"` | auto | Override dialect detection |
| `debug` | `boolean` | `false` | Log queries |
| `onQuery` | `(sql, params) => void` | — | Query hook |

### Drizzle utility functions

| Function | Import |
|----------|--------|
| `buildWhere` | `@justwant/db/drizzle/buildWhere` |
| `buildOrderBy` | `@justwant/db/drizzle/buildOrderBy` |
| `buildPagination` | `@justwant/db/drizzle/buildPagination` |
| `upsert` | `@justwant/db/drizzle/upsert` |
| `bulkInsert` | `@justwant/db/drizzle/bulkInsert` |
| `collectSchemas` | `@justwant/db/drizzle/collectSchemas` |

## Prisma adapter

```ts
import { createPrismaAdapter } from "@justwant/db/prisma";

const adapter = createPrismaAdapter(prisma, { dialect: "pg" }); // dialect default: "pg"
const users = adapter.defineTable("user", userContract, {       // first arg = lowercase model name
  id: { name: "id" },
  email: { name: "email" },
  // ...
});
```

### createPrismaAdapter options

| Option | Type | Default |
|--------|------|---------|
| `dialect` | `"pg" \| "mysql" \| "sqlite"` | `"pg"` |

## Waddler adapter

```ts
import { createDb } from "@justwant/db/waddler";
import { createBunSqliteAdapter } from "@justwant/db/bun-sqlite";

const db = createDb(createBunSqliteAdapter({ connection: ":memory:" }));
const users = db.defineTable("users", userContract, {
  id: { name: "id" },
  email: { name: "email" },
  createdAt: { name: "created_at" },
  deletedAt: { name: "deleted_at" },
});
await users.createTable();
```

Waddler does NOT implement `transaction()`.

### Waddler sub-drivers

| Import | Factory | Database |
|--------|---------|----------|
| `@justwant/db/bun-sqlite` | `createBunSqliteAdapter` | Bun SQLite (built-in) |
| `@justwant/db/pg` | `createPgAdapter` | PostgreSQL (node-postgres) |
| `@justwant/db/bun-sql` | `createBunSqlAdapter` | PostgreSQL (Bun.sql) |
| `@justwant/db/postgres-js` | `createPostgresJsAdapter` | PostgreSQL (postgres.js) |
| `@justwant/db/neon` | `createNeonAdapter` | Neon serverless |
| `@justwant/db/turso` | `createTursoAdapter` | Turso / libSQL |
| `@justwant/db/d1` | `createD1Adapter` | Cloudflare D1 |
| `@justwant/db/durable-objects` | `createDurableObjectsAdapter` | Cloudflare Durable Objects |
| `@justwant/db/mysql` | `createMysqlAdapter` | MySQL (mysql2) |
| `@justwant/db/planetscale` | `createPlanetScaleAdapter` | PlanetScale |
| `@justwant/db/tidb` | `createTidbAdapter` | TiDB |
| `@justwant/db/pglite` | `createPgliteAdapter` | PGlite |
| `@justwant/db/better-sqlite3` | `createBetterSqlite3Adapter` | better-sqlite3 (Node.js) |
| `@justwant/db/xata` | `createXataAdapter` | Xata |
| `@justwant/db/vercel-postgres` | `createVercelPostgresAdapter` | Vercel Postgres |

## Soft delete options

```ts
adapter.defineTable(source, contract, mapping, {
  softDeleteColumn: "archivedAt", // custom column name
  // softDeleteColumn: null,       // disable soft delete
});
```

## Transactions

```ts
await adapter.transaction(async (tx) => {
  const txUsers = tx.defineTable(source, contract, mapping);
  await txUsers.create({ ... });
});
```

Drizzle and Prisma only. Waddler does not support transactions.

## Errors (`@justwant/db/errors`)

| Class | When |
|-------|------|
| `AdapterNotFoundError` | Row not found |
| `AdapterUniqueViolationError` | Unique constraint |
| `AdapterForeignKeyViolationError` | Foreign key violation |
| `AdapterNotNullViolationError` | NOT NULL constraint |
| `AdapterCheckViolationError` | CHECK constraint |
| `AdapterConstraintError` | Other constraint |
| `AdapterConnectionError` | Connection failure |
| `AdapterTransactionError` | Transaction error |
| `AdapterTimeoutError` | Query timeout |
| `AdapterMappingError` | Invalid mapping config |
| `AdapterUnsupportedError` | Operation not supported |

```ts
import { AdapterUniqueViolationError } from "@justwant/db/errors";
if (err instanceof AdapterUniqueViolationError) { ... }
```

## tableConforms

```ts
import { tableConforms } from "@justwant/db/conforms";
tableConforms(table); // type guard
```
