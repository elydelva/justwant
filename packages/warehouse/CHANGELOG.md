# @justwant/warehouse

## [0.3.2](https://github.com/elydelva/justwant/compare/warehouse-v0.3.1...warehouse-v0.3.2) (2026-03-28)


### Bug Fixes

* **sonar:** fix all 40 SonarQube MAJOR (medium) issues ([d902d86](https://github.com/elydelva/justwant/commit/d902d861e5157de270fa6147eedc9fb51b02594d))

## [0.3.1](https://github.com/elydelva/justwant/compare/warehouse-v0.3.0...warehouse-v0.3.1) (2026-03-28)


### Bug Fixes

* **sonar:** fix all 29 SonarQube CRITICAL issues ([b9bdda2](https://github.com/elydelva/justwant/commit/b9bdda24ffa168f62232d11939f19a5d32fb4971))
* **storage:** update conditional checks in ensure-supabase.sh to use double brackets for improved syntax ([b9bdda2](https://github.com/elydelva/justwant/commit/b9bdda24ffa168f62232d11939f19a5d32fb4971))

## [0.3.0](https://github.com/elydelva/justwant/compare/warehouse-v0.2.0...warehouse-v0.3.0) (2026-03-28)


### Features

* **config:** enhance configuration management with multi-source support and validation ([98d70bd](https://github.com/elydelva/justwant/commit/98d70bd3a1345bae2e5c6de5ad73ccfd0ea0100d))
* **core:** introduce @justwant/core and eliminate SQL utility duplication across db and warehouse ([8d4d596](https://github.com/elydelva/justwant/commit/8d4d596b7a69203173ebec4148ce63d6ae8912fa))
* update README files across multiple packages to include license badges, installation instructions, and enhanced usage examples. Improve documentation clarity and structure for better user guidance. ([c2846a5](https://github.com/elydelva/justwant/commit/c2846a509d74a3a5fdd01470f2da32704e0cc050))


### Dependencies

* **db,warehouse:** add @justwant/core as dependency ([712d0b4](https://github.com/elydelva/justwant/commit/712d0b45bb88f1763e196c11d25669733da2f248))

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
