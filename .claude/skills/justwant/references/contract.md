# @justwant/contract

Contract definitions. defineContract, fields, Infer. Schema-less, type-safe.

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

## Mapping

defaultMapping: "camelToSnake" or mapping: { key: { name: "column" } }
