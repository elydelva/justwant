# Warehouse Drivers

Pass the driver config to `createWarehouse` for tree-shaking. Import only the driver you need.

## DuckDB

**Package:** `@justwant/warehouse/duckdb`  
**Peer deps:** waddler, @duckdb/node-api

```ts
import { createWarehouse } from "@justwant/warehouse";
import { createDuckDbAdapter } from "@justwant/warehouse/duckdb";

const warehouse = createWarehouse(createDuckDbAdapter({ path: ":memory:" }));
// or with file
const warehouse = createWarehouse(createDuckDbAdapter({ path: "./data.duckdb" }));
// or with existing client
const warehouse = createWarehouse(createDuckDbAdapter({ client: myDuckDbClient }));
```

| Option | Type | Description |
|--------|------|-------------|
| `path` | `string` | `:memory:` or file path. Default: `:memory:` |
| `client` | `unknown` | Existing DuckDB client |

## ClickHouse

**Package:** `@justwant/warehouse/clickhouse`  
**Peer deps:** waddler, @clickhouse/client

```ts
import { createWarehouse } from "@justwant/warehouse";
import { createClickHouseAdapter } from "@justwant/warehouse/clickhouse";

const warehouse = createWarehouse(
  createClickHouseAdapter({ connection: "http://localhost:8123" })
);
// or with existing client
const warehouse = createWarehouse(createClickHouseAdapter({ client: myClickHouseClient }));
```

| Option | Type | Description |
|--------|------|-------------|
| `connection` | `string` | URL (e.g. http://localhost:8123). Default: `http://localhost:8123` |
| `client` | `unknown` | Existing ClickHouse client |

## Mapping

Contracts use `defineContract(tableName, fields, options?)`. By default, contract keys map 1:1 to column names.

```ts
defineContract("events", { user_id: string().required() });
// → column "user_id"
```

**camelCase → snake_case:** use `defaultMapping: "camelToSnake"`:

```ts
defineContract("events", { userId: string().required() }, { defaultMapping: "camelToSnake" });
// → column "user_id"
```

**Override specific keys:** use `mapping`:

```ts
defineContract("events", { userId: string().required() }, {
  mapping: { userId: { name: "user_id" } },
});
```
