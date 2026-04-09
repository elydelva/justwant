# @justwant/contract

Contract definitions without DDL. Typed fields, validation, and conformity checks.

## Install

```bash
bun add @justwant/contract
# peer dep (only needed if you use .schema() or validateContractData):
bun add @standard-schema/spec
```

## Entry points

| Import | Exports |
|--------|---------|
| `@justwant/contract` | `defineContract`, `field`, `Infer`, `validateContractData`, `conformsTo`, `assertTableConforms`, `tableConforms`, errors, schemas |
| `@justwant/contract/fields` | All field builders + schema exports (tree-shakeable) |

## defineContract

```ts
import { defineContract, type Infer } from "@justwant/contract";
import { uuid, string, email, integer, boolean, date, json } from "@justwant/contract/fields";

const UserContract = defineContract("users", {
  id: uuid().required().primaryKey(),
  email: email().required().unique(),
  name: string().optional(),
  age: integer().optional(),
  active: boolean().required().default("1"),
  createdAt: date().required(),
  meta: json().optional(),
}, {
  defaultMapping: "camelToSnake",
  mapping: { createdAt: { name: "created_at" } }, // explicit override
});

type User = Infer<typeof UserContract>;
// { id: string; email: string; name: string | undefined; ... }
```

### DefineContractOptions

| Option | Type | Description |
|--------|------|-------------|
| `defaultMapping` | `"camelToSnake"` | Auto-convert camelCase keys to snake_case column names |
| `mapping` | `Partial<Record<string, { name: string }>>` | Per-key column name overrides |

### TableContract shape

| Property | Type | Description |
|----------|------|-------------|
| `tableName` | `string` | Table name passed to `defineContract` |
| `fields` | `T` | The fields object |
| `mapping` | `StringMapping<T>` | Resolved `{ [key]: { name: columnName } }` |

## Field builders

Import from `@justwant/contract` or `@justwant/contract/fields`.

### Primitive builders

| Builder | Column type | TS type | Notes |
|---------|-------------|---------|-------|
| `uuid()` | `TEXT` | `string` | Includes UUID regex schema |
| `string()` | `TEXT` | `string` | No built-in schema |
| `number()` | `REAL` | `number` | |
| `integer()` | `INTEGER` | `number` | |
| `boolean()` | `INTEGER` | `boolean` | SQLite stores as 0/1 |
| `date()` | `TEXT` | `Date` | |
| `json()` | `TEXT` | `unknown` | |

### Semantic builders (sugar)

| Builder | Equivalent to | Validates |
|---------|--------------|-----------|
| `email()` | `string().schema(emailSchema)` | RFC 5321 email |
| `url()` | `string().schema(urlSchema)` | http/https URL |
| `ip()` | `string().schema(ipSchema)` | IPv4 or IPv6 |
| `ipv4()` | `string().schema(ipv4Schema)` | IPv4 only |
| `ipv6()` | `string().schema(ipv6Schema)` | IPv6 only |
| `hostname()` | `string().schema(hostnameSchema)` | DNS hostname |
| `slug()` | `string().schema(slugSchema)` | `[a-z0-9-]+` |
| `integer()` | — | Plain integer |

### Chainable methods

| Method | Description |
|--------|-------------|
| `.required()` | `_required: true`, `_nullable: false` |
| `.optional()` | `_required: false`, `_nullable: true` (default) |
| `.primaryKey()` | Marks `_primaryKey: true` |
| `.unique()` | Marks `_unique: true` |
| `.default(val: string)` | Sets SQL default literal |
| `.schema(s: StandardSchemaV1)` | Attaches a Standard Schema validator; changes inferred type |

## Built-in schema exports

These `StandardSchemaV1` objects are used internally by semantic builders and can be composed:

`uuidSchema`, `emailSchema`, `urlSchema`, `ipSchema`, `ipv4Schema`, `ipv6Schema`, `hostnameSchema`, `slugSchema`

```ts
import { emailSchema } from "@justwant/contract/fields";
```

## Validation

```ts
import { validateContractData, ContractValidationError } from "@justwant/contract";

const result = validateContractData(data, UserContract.fields);

if (!result.ok) {
  // result.issues: ValidationIssue[]
  for (const issue of result.issues) {
    console.error(issue.path, issue.message);
  }
}

// Throw pattern:
if (!result.ok) throw new ContractValidationError(result.issues);
```

### validateContractData options

| Option | Type | Description |
|--------|------|-------------|
| `keys` | `string[]` | Only validate these keys (useful for partial updates) |

### ValidationIssue

| Field | Type |
|-------|------|
| `path` | `string` |
| `message` | `string` |

`ContractValidationError` extends `Error` with `.issues: ValidationIssue[]`.

## Conformity

Used by consuming libraries (e.g. `@justwant/db`) to verify a table's contract matches expected fields.

```ts
import { conformsTo, assertTableConforms, tableConforms } from "@justwant/contract";

// Compile-time check — fails to type-check if non-conforming:
conformsTo(userTable, UserContract);

// Runtime assertion — throws ContractConformityError if missing/mismatched:
assertTableConforms(userTable, UserContract);

// Runtime assertion + cast:
const typed = tableConforms(userTable, UserContract);
```

| Function | When it errors |
|----------|---------------|
| `conformsTo(table, contract)` | Compile-time type error if required fields are missing |
| `assertTableConforms(table, contract)` | Throws `ContractConformityError` if a required field is absent or not required |
| `tableConforms(table, contract)` | Same as `assertTableConforms` but also returns the table cast to the expected contract type |

`ContractConformityError` extends `Error`.
