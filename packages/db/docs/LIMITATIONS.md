# Limitations

Known limitations and workarounds for @justwant/db adapters.

## better-sqlite3: `run()` vs `execute()`

The better-sqlite3 driver requires `run()` for statements that do not return data (DDL, DELETE, UPDATE without RETURNING). The Waddler better-sqlite3 integration may use `execute()` internally for all operations, which can cause:

```
TypeError: This statement does not return data. Use run() instead
```

**Impact:** `hardDelete`, raw DDL, and other non-returning operations may fail when using `@justwant/db/better-sqlite3`.

**Workaround:** Use `db.sql.unsafe("CREATE TABLE ...").run()` for DDL when available. For CRUD, `create` and `findById` work; `hardDelete` may need to be skipped or replaced with raw SQL.

**Runtime:** better-sqlite3 uses native bindings. Run E2E tests with **Node** (not Bun): `bun run test:better-sqlite3`.

## Waddler: no transaction support in E2E matrix

The Waddler adapter does not expose a `transaction()` method. The shared E2E matrix (`runE2EMatrix`) runs scenarios across Bun SQLite, PGLite, PostgreSQL, and MySQL, but the transaction scenario is skipped for all Waddler setups.

**Impact:** Transaction behavior is not validated in the matrix for Waddler backends.

**Workaround:** Use Drizzle or Prisma adapters when transactions are required. Drizzle supports `adapter.transaction(fn)` for SQLite, PostgreSQL, and MySQL.
