# @justwant/warehouse

OLAP DAL. Contract-first, append-only. ClickHouse, DuckDB.

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

await events.insert([{ timestamp: new Date(), user_id: crypto.randomUUID(), event_type: "purchase", amount: 99 }]);
const rows = await events.query({ where: { event_type: "purchase" }, limit: 100 });
const agg = await events.aggregate({ groupBy: ["event_type"], select: { total: "sum(amount)", count: "count()" } });
```

## Drivers

createClickHouseAdapter (warehouse/clickhouse), createDuckDbAdapter (warehouse/duckdb)
