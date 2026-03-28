# @justwant/contract

## [0.3.0](https://github.com/elydelva/justwant/compare/contract-v0.2.1...contract-v0.3.0) (2026-03-28)


### Features

* **cron, refereal, waitlist, actor, bezier, flag, preference:** initiale realease ([9dcaacb](https://github.com/elydelva/justwant/commit/9dcaacb2636630250b9549154877a5fe4947c2e8))
* update README files across multiple packages to include license badges, installation instructions, and enhanced usage examples. Improve documentation clarity and structure for better user guidance. ([c2846a5](https://github.com/elydelva/justwant/commit/c2846a509d74a3a5fdd01470f2da32704e0cc050))

## 0.2.1

### Patch Changes

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

## 0.2.0

### Minor Changes

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

### Patch Changes

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
