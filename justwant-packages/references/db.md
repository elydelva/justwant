# @justwant/db

Data Access Layer. Contracts, Drizzle, Prisma, Waddler. MappedTable, AdapterError.

## Usage

```ts
import { defineContract, field, type InferContract } from "@justwant/contract";
import { createDrizzleAdapter } from "@justwant/db/drizzle";

const UserContract = defineContract({
  id: field<string>().required(),
  email: field<string>().required(),
});

const db = createDb(createBunSqliteAdapter({ connection: ":memory:" }));
const users = db.table(UserContract);
await users.createTable();
await users.create({ id: "1", email: "a@b.com" });
```

## Subpaths

db/drizzle, db/prisma, db/waddler, db/bun-sqlite, db/pg, db/neon, db/table, db/adapter, db/errors
