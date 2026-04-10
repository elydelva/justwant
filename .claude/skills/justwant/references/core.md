# @justwant/core

Internal shared SQL utilities for the @justwant ecosystem. Not published for direct application use — consumed by `@justwant/db` and `@justwant/warehouse`.

## Usage

Only for package authors implementing a SQL-backed `@justwant` adapter:

```ts
import {
  mapRowToContract,
  mapContractToRow,
  appendWhere,
  appendOrderBy,
} from "@justwant/core/db";
```

## API — `@justwant/core/db`

| Export | Description |
|--------|-------------|
| `WaddlerSql` / `WaddlerQuery` | Interfaces for the Waddler SQL client and query object |
| `StringMapping` / `ContractStringMapping` | Types mapping contract keys to column names |
| `mapRowToContract` | Maps a DB row to a contract shape (`null` → `undefined`, ISO string → `Date`) |
| `mapContractToRow` | Maps a contract row to DB column values for insert (`Date` → ISO string) |
| `appendWhere` | Appends a parameterized `WHERE` clause to a Waddler query |
| `appendOrderBy` | Appends an `ORDER BY` clause to a Waddler query |
| `escapeIdentifier` | Escapes a SQL identifier with double quotes |
| `escapeStringLiteral` | Escapes a SQL string literal with single quotes |
| `toRows` | Normalizes a Waddler query result to a row array |
| `parseExistResult` | Parses an `EXISTS`-style query result to a boolean |
