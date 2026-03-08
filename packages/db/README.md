# @justwant/db

[![npm version](https://img.shields.io/npm/v/@justwant/db.svg)](https://www.npmjs.com/package/@justwant/db)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Data Access Layer for transactional databases. Define contracts once, plug any backend (Drizzle, Prisma, Waddler).

## Installation

```bash
bun add @justwant/db
# or
npm install @justwant/db
# or
pnpm add @justwant/db
```

## Usage

### defineContract, field, InferContract

```ts
import { defineContract, field, type InferContract } from "@justwant/contract";

const UserContract = defineContract({
  id: field<string>().required(),
  email: field<string>().required(),
  emailVerified: field<boolean>().required(),
  createdAt: field<Date>().required(),
  name: field<string>().optional(),
});

type User = InferContract<typeof UserContract>;
// { id: string; email: string; emailVerified: boolean; createdAt: Date; name?: string }
```

### AdapterError

```ts
import { AdapterError } from "@justwant/db";

throw new AdapterError("User not found", "NOT_FOUND");
```

### Hierarchy

```
@justwant/db              ← base (contracts, types)
@justwant/db/drizzle      ← Drizzle ORM implementation
@justwant/db/prisma       ← Prisma implementation
@justwant/db/waddler      ← Waddler core (createDb, createWaddlerAdapter)
@justwant/db/bun-sqlite   ← Bun SQLite (createBunSqliteAdapter)
@justwant/db/pg           ← PostgreSQL (createPgAdapter)
...                       ← other backends (neon, mysql, turso, etc.)
        ↓ consumed by
@justwant/auth, @justwant/audit, @justwant/keys...
  → see only MappedTable<TContract>, never Drizzle/Prisma types
```

## Exports

| Entry | Content |
|-------|---------|
| `@justwant/db` | Base: table types, errors, tableConforms |
| `@justwant/db/base` | Same as main |
| `@justwant/contract` | field, defineContract, InferContract, uuid, string, etc. (import from @justwant/contract) |
| `@justwant/db/table` | MappedTable, MappedTableInternal, BoundQuery, CreateInput |
| `@justwant/db/adapter` | BaseAdapter, PackageAdapter |
| `@justwant/db/errors` | AdapterError hierarchy |
| `@justwant/db/conforms` | tableConforms |
| `@justwant/db/drizzle` | createDrizzleAdapter, defineMappedTable, helpers |
| `@justwant/db/prisma` | createPrismaAdapter, helpers |
| `@justwant/db/waddler` | createDb, createWaddlerAdapter (core) |
| `@justwant/db/bun-sqlite` | createBunSqliteAdapter |
| `@justwant/db/pg` | createPgAdapter |
| `@justwant/db/neon` | createNeonAdapter |
| ... | other backends: vercel-postgres, xata, pglite, bun-sql, postgres-js, mysql, planetscale, tidb, turso, d1, durable-objects, better-sqlite3 |

### Table-centric DDL (Waddler)

```ts
import { defineContract, uuid, email, string } from "@justwant/contract";
import { createDb } from "@justwant/db/waddler";
import { createBunSqliteAdapter } from "@justwant/db/bun-sqlite";

const UserContract = defineContract("users", {
  id: uuid().required().primaryKey(),
  email: email().required(),
  name: string().optional(),
});

const db = createDb(createBunSqliteAdapter({ connection: ":memory:" }));
const users = db.table(UserContract);

await users.createTable();
const exists = await users.exist(); // true
// ... create, findById, etc.
await users.drop();
```

## Docs

- [Drivers](docs/DRIVERS.md) — config per driver, mapping
- [Limitations](docs/LIMITATIONS.md) — better-sqlite3 `run()` vs `execute()`, Waddler transactions

## E2E Tests

Tests run against real database instances.

| Backend | Drizzle | Waddler | Prisma |
|---------|---------|---------|--------|
| SQLite (Bun) | Yes | Yes | Yes |
| PGLite | — | Yes | — |
| PostgreSQL | Yes | Yes | Yes |
| MySQL | Yes | Yes | Yes |

Without Docker: SQLite, PGLite, and Prisma SQLite run. For full coverage including PostgreSQL and MySQL:

```bash
cd packages/db && docker compose up -d
bun run test:e2e:full
```

Or step by step:

```bash
bunx prisma generate --schema=prisma/schema.postgres.prisma
bunx prisma generate --schema=prisma/schema.mysql.prisma
docker compose up -d
# wait ~5s for DBs to be ready
DATABASE_URL=postgres://test:test@localhost:5432/justwant_test bunx prisma db push --schema=prisma/schema.postgres.prisma --skip-generate
DATABASE_URL=mysql://test:test@localhost:3306/justwant_test bunx prisma db push --schema=prisma/schema.mysql.prisma --skip-generate --accept-data-loss
bun test
```

Stop containers when done:

```bash
bun run test:e2e:down
```

## Invariants

See [docs/CONTRACT.md](./docs/CONTRACT.md) for detailed invariants and implementation guidance.

## License

MIT © [elydelva](https://github.com/elydelva)
