# @justwant/preference

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

User preferences with typed schema. Declarative definition, actor-agnostic, storage via repository.

## Installation

```bash
bun add @justwant/preference
# or
npm install @justwant/preference
# or
pnpm add @justwant/preference
```

## Usage

```ts
import {
  definePreference,
  createPreferenceService,
  createMemoryPreferenceAdapter,
} from "@justwant/preference";

const themePref = definePreference({
  id: "theme",
  default: "system",
});

const service = createPreferenceService({
  preferences: [themePref],
  repo: createMemoryPreferenceAdapter(),
});

const user = { type: "user" as const, id: "usr_1" };

// Passer la définition directement (pas la clé en string)
await service.set(user, themePref, "dark");
const theme = await service.get(user, themePref); // "dark"
const all = await service.list(user); // { theme: "dark" }
await service.reset(user, themePref);
```

## API

| Export | Description |
|--------|-------------|
| `definePreference(options)` | Declarative preference (id, key?, schema?, default?) |
| `createPreferenceService(options)` | Service with list, get, set, setMany, reset |
| `createMemoryPreferenceAdapter()` | In-memory storage (tests/dev) |
| `createPreferenceDbAdapter(options)` | DB storage via MappedTable |

| Service method | Description |
|----------------|-------------|
| `list(actor)` | Get all preferences for actor |
| `get(actor, prefDef)` | Get single preference |
| `set(actor, prefDef, value)` | Set preference |
| `setMany(actor, entries)` | Set multiple |
| `reset(actor, prefDef)` | Reset to default |

## Actor

Identity uses `Actor` from `@justwant/actor`: `{ type, id, within? }`. Preferences are isolated per actor; an actor with `within: { type: "org", id: "org-1" }` has distinct preferences from the same actor without `within`.

## Subpaths

| Path | Description |
|------|-------------|
| `@justwant/preference` | Main API |
| `@justwant/preference/adapters/db` | DB adapter |
| `@justwant/preference/adapters/memory` | Memory adapter |
| `@justwant/preference/errors` | PreferenceError |

## Validation

Schemas must implement `StandardSchemaV1` (valibot, zod, etc.). Validation is optional; without schema, any value is accepted.

## License

MIT
