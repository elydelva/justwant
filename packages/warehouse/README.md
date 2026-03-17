# @justwant/warehouse

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

DAL for data warehouses (OLAP). Contract-first, append-only. Batch insert, query, aggregate.

## Installation

```bash
bun add @justwant/warehouse @justwant/contract waddler
# or
npm install @justwant/warehouse @justwant/contract waddler
# or
pnpm add @justwant/warehouse @justwant/contract waddler
```

For ClickHouse: `bun add @clickhouse/client`  
For DuckDB: `bun add @duckdb/node-api`

## Usage

```ts
import { defineContract, uuid, string, number, date } from "@justwant/contract";
import { createWarehouse } from "@justwant/warehouse";
import { createDuckDbAdapter } from "@justwant/warehouse/duckdb";

const EventContract = defineContract("events", {
  timestamp: date().required(),
  user_id: uuid().required(),
  event_type: string().required(),
  amount: number().optional(),
});

const warehouse = createWarehouse(createDuckDbAdapter({ path: ":memory:" }));
const events = warehouse.table(EventContract);
await events.createTable();

await events.insert([
  { timestamp: new Date(), user_id: crypto.randomUUID(), event_type: "purchase", amount: 99 },
  { timestamp: new Date(), user_id: crypto.randomUUID(), event_type: "view" },
]);

const rows = await events.query({ where: { event_type: "purchase" }, limit: 100 });
const agg = await events.aggregate({
  groupBy: ["event_type"],
  select: { total: "sum(amount)", count: "count()" },
});
```

## Drivers

- **ClickHouse**: `createClickHouseAdapter` from `@justwant/warehouse/clickhouse`
- **DuckDB**: `createDuckDbAdapter` from `@justwant/warehouse/duckdb`

Pass the driver config to `createWarehouse` for tree-shaking (import only the driver you need).

## Docs

- [Drivers](docs/DRIVERS.md) — config per driver, mapping

## API

| Export | Description |
|--------|-------------|
| `createWarehouse(config)` | Build Warehouse from driver config |
| `createWarehouseFromSql(sql, { dialect })` | Low-level: build from Waddler SQL client |
| `warehouse.table(contract)` | Returns WarehouseMappedTable |

| Table methods | Description |
|---------------|-------------|
| `createTable()` | Create table |
| `exist()` | Check if table exists |
| `drop()` | Drop table |
| `insert(rows)` | Batch insert |
| `query({ where, limit })` | Query rows |
| `aggregate({ groupBy, select })` | Aggregate |

## Subpaths

| Path | Description |
|------|-------------|
| `@justwant/warehouse` | Main API |
| `@justwant/warehouse/clickhouse` | ClickHouse adapter |
| `@justwant/warehouse/duckdb` | DuckDB adapter |

## License

MIT
