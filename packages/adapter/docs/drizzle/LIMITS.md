# Known Limits

## drizzle-orm Version Compatibility

- **0.45.x**: Tested and supported.
- **1.0.0-beta.x**: Tested with `1.0.0-beta.16` and compatible. The adapter uses the core query builder API (`select`, `insert`, `update`, `delete`, `eq`, `and`, `isNull`, `getTableName`) and does not rely on RQB (Relational Query Builder), so RQBv1→v2 migration does not affect this package.
- **Internal types**: `Table['_']['columns']` and `Column._.data` are used for mapping; if Drizzle changes these internals in a future release, `drizzle-types.ts` is the single point to update.

## Upsert

- **PostgreSQL**: Full support via `ON CONFLICT DO UPDATE`
- **MySQL**: Not supported (throws `AdapterUnsupportedError`). Use `ON DUPLICATE KEY` manually or a separate package.
- **SQLite**: Not supported in Phase 1. May be added later.

## Computed / Generated Columns

- Columns with database-side defaults (e.g. `DEFAULT (lower(hex(randomblob(16))))`) are supported for inserts when omitted.
- Application-generated values (e.g. `$defaultFn`) are handled by Drizzle; ensure your mapping includes them when reading.
- Virtual/computed columns that are not stored are not supported in the mapping.

## JSON / JSONB

- Stored and retrieved as `unknown` by default.
- Use schema-level typing or `mapRowToContract` custom logic for typed JSON fields.

## Index Signatures in Contracts

- `InferContract` does not support index signatures (`[key: string]: T`).
- Use explicit field definitions only.

## Migrations

- `collectSchemas()` returns tables for inspection.
- Use **drizzle-kit** for migration generation: `drizzle-kit generate`, `drizzle-kit migrate`.

## Transactions

- Supported when the Drizzle client exposes `transaction(fn)`.
- The transaction adapter uses the same API; all `defineTable` tables use the transactional client during the callback.
