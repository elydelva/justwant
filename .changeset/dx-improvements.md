---
"@justwant/contract": patch
"@justwant/warehouse": minor
"@justwant/db": major
---

DX improvements: contract source, BigInt, lifecycle, drivers, mapping docs.

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
