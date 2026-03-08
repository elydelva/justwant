# @justwant/warehouse

## 0.2.0

### Minor Changes

- E2E tests with real ClickHouse (Docker)
- ClickHouse DDL: `Nullable(Type)` syntax fix
- ClickHouse: `.command()` for DDL/mutations, typed `INSERT` for optional columns
- `parseWarehouseError`: extract `code` from nested `cause`
- Extended edge case coverage: limit 0, offset, aggregate empty table, exist/drop on non-existent table, amount 0, createTable idempotent

## 1.1.0

### Minor Changes

- bdd9aa6: DX improvements: contract source, BigInt, lifecycle, drivers, mapping docs.

  **@justwant/db**

  - **Breaking:** No longer re-exports `defineContract`, `field`, `uuid`, etc. Import from `@justwant/contract`.
  - **Breaking:** Removed subpaths `./contract`, `./validate`, `./fields`.
  - **Breaking:** Drivers no longer use `process.env.DATABASE_URL`. Pass `connection` explicitly.
  - **New:** `close?()` on Db when config provides it. `WaddlerConnectionConfig.close`.
  - **New:** [docs/DRIVERS.md](packages/db/docs/DRIVERS.md) — config per driver.

  **@justwant/warehouse**

  - **Breaking:** `createWarehouseAdapter` → `createWarehouseFromSql`.
  - **New:** `aggregate` normalizes BigInt to number (DuckDB/ClickHouse).
  - **New:** `close?()` on Warehouse. `WarehouseConnectionConfig.close`.
  - **New:** [docs/DRIVERS.md](packages/warehouse/docs/DRIVERS.md) — config, mapping.

  **@justwant/contract**

  - **New:** Mapping docs (default, camelToSnake, overrides) in README.

### Patch Changes

- Updated dependencies [bdd9aa6]
  - @justwant/contract@0.2.1

## 1.0.0

### Major Changes

- Unified interface: createWarehouse / createDb with driver config.

  **Breaking:** Driver factories (createDuckDbAdapter, createBunSqliteAdapter, etc.) now return connection config instead of the full adapter. Pass the config to createWarehouse or createDb.

  **Migration:**

  ```ts
  // @justwant/warehouse - Before
  const adapter = createDuckDbAdapter({ path: ":memory:" });

  // After
  const warehouse = createWarehouse(createDuckDbAdapter({ path: ":memory:" }));
  ```

  ```ts
  // @justwant/db (Waddler) - Before
  const adapter = createBunSqliteAdapter({ connection: ":memory:" });

  // After
  const db = createDb(createBunSqliteAdapter({ connection: ":memory:" }));
  ```

  **Types:** WarehouseAdapter → Warehouse, WaddlerAdapter → Db (breaking rename, no aliases).

### Minor Changes

- DX improvements: contract source, BigInt, lifecycle, drivers, mapping docs.

  **@justwant/db**

  - **Breaking:** No longer re-exports `defineContract`, `field`, `uuid`, etc. Import from `@justwant/contract`.
  - **Breaking:** Removed subpaths `./contract`, `./validate`, `./fields`.
  - **Breaking:** Drivers no longer use `process.env.DATABASE_URL`. Pass `connection` explicitly.
  - **New:** `close?()` on Db when config provides it. `WaddlerConnectionConfig.close`.
  - **New:** [docs/DRIVERS.md](packages/db/docs/DRIVERS.md) — config per driver.

  **@justwant/warehouse**

  - **Breaking:** `createWarehouseAdapter` → `createWarehouseFromSql`.
  - **New:** `aggregate` normalizes BigInt to number (DuckDB/ClickHouse).
  - **New:** `close?()` on Warehouse. `WarehouseConnectionConfig.close`.
  - **New:** [docs/DRIVERS.md](packages/warehouse/docs/DRIVERS.md) — config, mapping.

  **@justwant/contract**

  - **New:** Mapping docs (default, camelToSnake, overrides) in README.

### Patch Changes

- Updated dependencies
- Updated dependencies
  - @justwant/contract@0.2.0
