# @justwant/adapter

[![npm version](https://img.shields.io/npm/v/@justwant/adapter.svg)](https://www.npmjs.com/package/@justwant/adapter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Adapter contracts, base types, and implementations (Drizzle, Prisma). Single package with subpaths.

## Installation

```bash
bun add @justwant/adapter
# or
npm install @justwant/adapter
# or
pnpm add @justwant/adapter
```

## Usage

### defineContract, field, InferContract

```ts
import { defineContract, field, type InferContract } from "@justwant/adapter";

const UserContract = defineContract({
  id: field<string>().required(),
  email: field<string>().required(),
  emailVerified: field<boolean>().required(),
  createdAt: field<Date>().required(),
  name: field<string>().optional(),
});

type User = InferContract<typeof UserContract>;
// { id: string; email: string; emailVerified: boolean; createdAt: Date; name?: string }
```

### AdapterError

```ts
import { AdapterError } from "@justwant/adapter";

throw new AdapterError("User not found", "NOT_FOUND");
```

### Hierarchy

```
@justwant/adapter          ← base (contracts, types)
@justwant/adapter/base     ← same as above
@justwant/adapter/drizzle  ← Drizzle ORM implementation
@justwant/adapter/prisma   ← Prisma implementation
        ↓ consumed by
@justwant/auth, @justwant/audit, @justwant/keys...
  → see only MappedTable<TContract>, never Drizzle/Prisma types
```

## Exports

| Entry | Content |
|-------|---------|
| `@justwant/adapter` | Base: contracts, types, errors |
| `@justwant/adapter/base` | Same as main |
| `@justwant/adapter/contract` | field, defineContract, InferContract, AnyContract |
| `@justwant/adapter/table` | MappedTable, MappedTableInternal, BoundQuery, CreateInput |
| `@justwant/adapter/adapter` | BaseAdapter, PackageAdapter |
| `@justwant/adapter/errors` | AdapterError hierarchy |
| `@justwant/adapter/drizzle` | createDrizzleAdapter, defineMappedTable, helpers |
| `@justwant/adapter/prisma` | createPrismaAdapter, helpers |

## Invariants

See [docs/CONTRACT.md](./docs/CONTRACT.md) for detailed invariants and implementation guidance.

## License

MIT © [elydelva](https://github.com/elydelva)
