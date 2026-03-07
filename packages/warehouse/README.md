# @justwant/warehouse

DAL for data warehouses (OLAP). Contract-first, append-only. Batch insert, query, aggregate.

## Install

```bash
bun add @justwant/warehouse @justwant/contract waddler
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

- `createWarehouse(config)` — builds a `Warehouse` from driver config (createDuckDbAdapter, etc.)
- `createWarehouseFromSql(sql, { dialect })` — low-level: build from Waddler SQL client directly
- `table(contract)` — returns `WarehouseMappedTable` with `createTable`, `exist`, `drop`, `insert`, `query`, `aggregate`
- `adapter.createTable(contract)` — legacy DDL (prefer `table(contract).createTable()`)
