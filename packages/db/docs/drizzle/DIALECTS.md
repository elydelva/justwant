# Supported Dialects and Types

`@justwant/db/drizzle` supports PostgreSQL, MySQL, and SQLite via Drizzle ORM.

## Drivers

| Dialect | Drizzle driver | Package |
|---------|---------------|---------|
| **PostgreSQL** | `drizzle-orm/node-pg` | `pg` |
| **MySQL** | `drizzle-orm/mysql2` | `mysql2` |
| **SQLite** | `drizzle-orm/better-sqlite3` | `better-sqlite3` |
| **SQLite (Bun)** | `drizzle-orm/bun-sqlite` | built-in `bun:sqlite` |

## Type Support by Dialect

### PostgreSQL

- `text`, `varchar`, `char` → `string`
- `integer`, `bigint`, `smallint` → `number`
- `boolean` → `boolean`
- `timestamp`, `timestamptz`, `date` → `Date`
- `json`, `jsonb` → `unknown` (or typed via schema)
- `uuid` → `string`
- `numeric`, `decimal` → `number` or `string` (precision-dependent)

### MySQL

- `varchar`, `char`, `text` → `string`
- `int`, `bigint`, `tinyint` → `number` (tinyint as boolean: `0`/`1`)
- `boolean` (alias for tinyint) → `boolean`
- `datetime`, `timestamp`, `date` → `Date`
- `json` → `unknown`
- `decimal` → `number` or `string`

### SQLite

- `text` → `string`
- `integer` → `number`
- `real` → `number`
- `blob` → `Buffer` or `Uint8Array`
- `boolean` (stored as integer 0/1) → `boolean`
- `numeric` → `number` or `string`

## Enums

- **PostgreSQL**: `pgEnum()` → TypeScript `string` union
- **MySQL**: `mysqlEnum()` → TypeScript `string` union
- **SQLite**: Use `text` with check constraint or application-level validation

## Dialect Detection

The adapter infers dialect from `db.dialect.name`:

- `"pg"` or `"postgresql"` → PostgreSQL
- `"mysql"` → MySQL
- `"sqlite"` or `"bun-sqlite"` → SQLite

For drivers where auto-detection fails (e.g. `drizzle-orm/bun-sqlite`), pass `dialect` explicitly:

```ts
createDrizzleAdapter(db, { dialect: "sqlite" });
```
