# @justwant/contract

Contract definitions for `defineContract`, fields, conforms, and validate. Schema-less, type-safe.

## Installation

```bash
bun add @justwant/contract
```

## Usage

```ts
import { defineContract, type Infer } from "@justwant/contract";
import { uuid, string, email } from "@justwant/contract/fields";

const UserContract = defineContract("users", {
  id: uuid().required().primaryKey(),
  email: email().required(),
  name: string().optional(),
});

type User = Infer<typeof UserContract>;
```

## Mapping (contract key → column name)

By default, contract keys map 1:1 to column names. Override with `defineContract(tableName, fields, options?)`:

```ts
defineContract("events", { user_id: string().required() });
// → column "user_id"
```

**camelCase → snake_case:** `defaultMapping: "camelToSnake"`:

```ts
defineContract("events", { userId: string().required() }, { defaultMapping: "camelToSnake" });
// → column "user_id"
```

**Override specific keys:** `mapping`:

```ts
defineContract("events", { userId: string().required() }, {
  mapping: { userId: { name: "user_id" } },
});
```

## Exports

- **Main** (`@justwant/contract`): `defineContract`, `field`, types, field builders, schemas, conforms, validate
- **Fields** (`@justwant/contract/fields`): `uuid`, `string`, `email`, etc. + schemas
- **Conforms** (`@justwant/contract/conforms`): `conformsTo`, `assertTableConforms`, `tableConforms`
- **Validate** (`@justwant/contract/validate`): `validateContractData`, `ContractValidationError`

## Peer dependency

- `@standard-schema/spec` (optional) — for schema validation
