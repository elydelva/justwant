# @justwant/warehouse

Contract-first OLAP DAL. Append-only. Typed insert, query, aggregate. Dialects: ClickHouse (production), DuckDB (local/testing).

## Install

```bash
bun add @justwant/warehouse

# DuckDB peer deps
bun add waddler @duckdb/node-api

# ClickHouse peer deps
bun add waddler @clickhouse/client
```

## Setup

```ts
import { createWarehouse } from "@justwant/warehouse";
import { createDuckDbAdapter } from "@justwant/warehouse/duckdb";
import { createClickHouseAdapter } from "@justwant/warehouse/clickhouse";

// DuckDB (in-memory)
const warehouse = createWarehouse(createDuckDbAdapter({ path: ":memory:" }));

// DuckDB (file)
const warehouse = createWarehouse(createDuckDbAdapter({ path: "./analytics.duckdb" }));

// ClickHouse
const warehouse = createWarehouse(createClickHouseAdapter({ connection: "http://localhost:8123" }));

// Switching dialects
const warehouse = createWarehouse(
  isDev
    ? createDuckDbAdapter({ path: ":memory:" })
    : createClickHouseAdapter({ connection: process.env.CLICKHOUSE_URL! })
);
```

## Usage

```ts
import { defineContract, string, integer, real } from "@justwant/contract";

// 1. Define contract
const eventsContract = defineContract("events", {
  userId: string().required(),
  eventName: string().required(),
  value: real().optional(),
  createdAt: string().required(),
}, { defaultMapping: "camelToSnake" }); // optional: camelCase → snake_case columns

// 2. Map table
const eventsTable = warehouse.table(eventsContract);

// 3. DDL
await eventsTable.createTable(); // CREATE TABLE IF NOT EXISTS
const exists = await eventsTable.exist(); // boolean
await eventsTable.drop();

// 4. Insert (batch, empty array is no-op)
await eventsTable.insert([
  { userId: "u_1", eventName: "page_view", value: null, createdAt: "2024-01-01T00:00:00Z" },
  { userId: "u_2", eventName: "purchase", value: 49.99, createdAt: "2024-01-01T00:01:00Z" },
]);

// 5. Query
const rows = await eventsTable.query({
  where: { eventName: "purchase" },
  orderBy: { createdAt: "desc" },
  limit: 10,
  offset: 0,
});

// 6. Aggregate
const totals = await eventsTable.aggregate<{ userId: string; total: number }>({
  groupBy: ["userId"],
  select: { total: 'SUM("value")' },
  where: { eventName: "purchase" },
});

// 7. Close
await warehouse.close?.();
```

## API

### `createWarehouse(config)` → `Warehouse`

| Member | Description |
|--------|-------------|
| `.table(contract)` | Returns `WarehouseMappedTable<T>` |
| `.createTable(contract)` | Bare `CREATE TABLE` (no `IF NOT EXISTS`) |
| `.close?()` | Release driver connection |
| `.sql` | Raw `WaddlerSql` instance |
| `.dialect` | `"clickhouse" \| "duckdb"` |

### `WarehouseMappedTable<T>` methods

| Method | Returns | Description |
|--------|---------|-------------|
| `createTable()` | `Promise<void>` | `CREATE TABLE IF NOT EXISTS` |
| `exist()` | `Promise<boolean>` | Check table existence |
| `drop()` | `Promise<void>` | `DROP TABLE` |
| `insert(rows)` | `Promise<void>` | Batch insert; empty array = no-op |
| `query(options?)` | `Promise<Row[]>` | Typed row query |
| `aggregate<A>(options)` | `Promise<A[]>` | Aggregation query |

### `QueryOptions<T>`

| Option | Type | Description |
|--------|------|-------------|
| `where` | `Partial<InferContract<T>>` | Equality filters |
| `orderBy` | `Record<string, "asc" \| "desc">` | Sort columns |
| `limit` | `number` | Max rows |
| `offset` | `number` | Rows to skip |

### `AggregateOptions<T, A>`

| Option | Type | Description |
|--------|------|-------------|
| `select` | `Record<string, string>` | SQL expressions, e.g. `{ count: "COUNT(*)" }` |
| `groupBy` | `(keyof T)[]` | Contract keys to group by |
| `where` | `Partial<InferContract<T>>` | Equality filters before grouping |

## Adapters

### `createDuckDbAdapter(config)` — `@justwant/warehouse/duckdb`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `path` | `string` | `":memory:"` | `:memory:` or file path |
| `client` | `unknown` | — | Reuse existing DuckDB client |

### `createClickHouseAdapter(config)` — `@justwant/warehouse/clickhouse`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `connection` | `string` | `"http://localhost:8123"` | ClickHouse server URL |
| `client` | `unknown` | — | Reuse existing `@clickhouse/client` instance |

## Dialect differences

| | DuckDB | ClickHouse |
|--|--------|------------|
| Column type: `string()` | `TEXT` | `String` / `Nullable(String)` |
| Column type: `integer()` | `INTEGER` | `Int64` / `Nullable(Int64)` |
| Column type: `real()` | `REAL` | `Float64` / `Nullable(Float64)` |
| `COUNT`/`SUM` return | `BigInt` → normalized to `number` | `string` → normalized to `number` |
| Default engine | — | `MergeTree() ORDER BY tuple()` |
| Mutations | Standard `await` | Via `.command()` (avoids JSON parse on empty response) |

## Errors

```ts
import { WarehouseError, WarehouseConnectionError, WarehouseTimeoutError } from "@justwant/warehouse";

// WarehouseError (code: "UNKNOWN")
// ├── WarehouseConnectionError (code: "CONNECTION") — ECONNREFUSED, ECONNRESET
// └── WarehouseTimeoutError   (code: "TIMEOUT")    — ETIMEDOUT
```

All errors have `code: string` and optional `metadata?: Record<string, unknown>`.
