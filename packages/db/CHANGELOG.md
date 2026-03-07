# @justwant/db

## 2.0.0

### Major Changes

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

- # Contract package extraction

  ## New package: @justwant/contract

  Extract contract system from @justwant/db into a dedicated package:

  - `defineContract`, `field`, `TableContract`, `StringMapping`
  - Field builders: `uuid`, `string`, `email`, etc.
  - Schemas: `uuidSchema`, `emailSchema`, etc.
  - `conformsTo`, `assertTableConforms`, `tableConforms`
  - `validateContractData`, `ContractValidationError`
  - `ContractConformityError` (replaces `AdapterMappingError` for conformity checks)

  ## @justwant/db changes

  - **Depends on** `@justwant/contract`
  - **Re-exports** all contract APIs for backward compatibility
  - Imports from `@justwant/db` and `@justwant/db/contract`, `@justwant/db/fields`, etc. remain valid
  - DDL (`getCreateTableSQL`) moved to `packages/db/src/ddl/` — TableContract no longer has `getCreateTableSQL` method

  ## Migration

  - For direct contract usage: `@justwant/db/contract` → `@justwant/contract` (optional)
  - Conformity errors: `AdapterMappingError` → `ContractConformityError` when using `assertTableConforms` from contract package

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

- Rename @justwant/adapter to @justwant/db. Package repositioned as Data Access Layer (DAL) for transactional databases.

  **Migration:** Replace `@justwant/adapter` with `@justwant/db` in all imports. Subpaths: `/drizzle`, `/prisma`, `/errors`, `/contract`, `/table`, `/adapter` unchanged. Waddler backends passent en top-level : `@justwant/db/waddler/bun-sqlite` → `@justwant/db/bun-sqlite` (et idem pour pg, neon, etc.). `@justwant/db/waddler` reste pour createWaddlerAdapter.

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

### Patch Changes

- Updated dependencies
- Updated dependencies
  - @justwant/contract@0.2.0

## 0.2.0

### Minor Changes

- Drizzle ORM implementation: defineMappedTable, createDrizzleAdapter, buildWhere, buildOrderBy, buildPagination, upsert (PostgreSQL), bulkInsert, collectSchemas, parseDbError. Soft delete, type-safe mapping, normalized error hierarchy.
