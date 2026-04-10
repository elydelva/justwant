# @justwant/preference

Typed, actor-agnostic user preferences with optional schema validation.

## Install

```bash
bun add @justwant/preference
```

## definePreference

```ts
import { definePreference } from "@justwant/preference";
import { z } from "zod";

const themePref = definePreference({ name: "theme", default: "system" });

const langPref = definePreference({
  name: "language",
  key: "lang",           // storage key — defaults to name
  schema: z.enum(["en", "fr", "de"]),
  default: "en",
});
```

### DefinePreferenceConfig\<N, T\>

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `N extends string` | required | Preference name and service key |
| `key` | `string` | `name` | Storage key (override if different from name) |
| `schema` | `StandardSchemaV1<unknown, T>` | — | Standard Schema validator (Zod, Valibot, etc.) |
| `default` | `T` | — | Default value when preference is not set |

`PreferenceDef<N, T>` is also callable: `themePref("usr_1")` → `{ type: "theme", id: "usr_1" }`.

## createPreferenceService

```ts
import {
  createPreferenceService,
  createMemoryPreferenceAdapter,
} from "@justwant/preference";

const service = createPreferenceService({
  preferences: [themePref, langPref],
  repo: createMemoryPreferenceAdapter(),
});

const user: Actor = { type: "user", id: "usr_1" };

await service.set(user, themePref, "dark");
const theme = await service.get(user, themePref);   // "dark"
const all = await service.list(user);               // { theme: "dark", language: "en" }
await service.reset(user, themePref);               // deletes stored value
```

### PreferenceService methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `list` | `(actor) => Promise<Record<string, unknown>>` | All preferences keyed by name; stored or default value |
| `get` | `(actor, pref) => Promise<T \| undefined>` | Single preference value; falls back to `pref.default` |
| `set` | `(actor, pref, value) => Promise<PreferenceEntry>` | Upsert a preference; validates against schema if set |
| `setMany` | `(actor, entries) => Promise<void>` | Upsert multiple preferences in sequence |
| `reset` | `(actor, pref) => Promise<void>` | Delete stored value; next `get` returns default |

### setMany usage

```ts
await service.setMany(user, [
  { pref: themePref, value: "dark" },
  { pref: langPref, value: "fr" },
]);
```

## Actor type

```ts
import type { Actor } from "@justwant/preference";
// re-exported from @justwant/actor
// { type: string; id: string; orgId?: string }
```

## Adapters

### createMemoryPreferenceAdapter

In-memory repository. Suitable for tests and local development.

```ts
import { createMemoryPreferenceAdapter } from "@justwant/preference";
const repo = createMemoryPreferenceAdapter();
```

### createPreferenceDbAdapter

Wraps a `@justwant/db` `MappedTable` (or any compatible table interface).

```ts
import { createPreferenceDbAdapter } from "@justwant/preference";

const repo = createPreferenceDbAdapter({ table: preferencesTable });
```

#### CreatePreferenceDbAdapterOptions

| Option | Type | Description |
|--------|------|-------------|
| `table` | `PreferenceTable` | A `MappedTable`-compatible object with `create`, `findOne`, `findMany`, `update`, `delete` |

`findMany` supports in-memory `orderBy`, `limit`, and `offset` when the underlying table does not.

## Errors

All errors extend `PreferenceError`.

| Class | Code | When thrown |
|-------|------|-------------|
| `PreferenceError` | `PREFERENCE_ERROR` | Base error class |
| `PreferenceValidationError` | `PREFERENCE_VALIDATION_ERROR` | `set` called with a value that fails the schema |
| `PreferenceNotFoundError` | `PREFERENCE_NOT_FOUND` | Preference key not registered in the service |

`PreferenceError` has `.code: string` and `.metadata?: Record<string, unknown>`.
`PreferenceNotFoundError` additionally has `.key: string`.

## PreferenceEntry fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Row ID |
| `preferenceKey` | `string` | Storage key from `PreferenceDef.key` |
| `actorType` | `string` | e.g. `"user"` |
| `actorId` | `string` | Actor identifier |
| `actorOrgId` | `string \| undefined` | Optional organisation scope |
| `value` | `unknown` | Stored value |
| `createdAt` | `Date` | |
| `updatedAt` | `Date` | |
