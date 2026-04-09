# @justwant/preference

User preferences. `definePreference`, `createPreferenceService`. Actor-agnostic.

## Usage

```ts
import { definePreference, createPreferenceService, createMemoryPreferenceAdapter } from "@justwant/preference";

// name: is the identifier (extends Definable<N>)
const themePref = definePreference({ name: "theme", default: "system" });
const langPref = definePreference({ name: "language", default: "en" });

const service = createPreferenceService({
  preferences: [themePref, langPref],
  repo: createMemoryPreferenceAdapter(),
});

const user = { type: "user" as const, id: "usr_1" };
await service.set(user, themePref, "dark");
const theme = await service.get(user, themePref);
const all = await service.list(user);
await service.reset(user, themePref);
```

`PreferenceDef<N, T>` extends `Definable<N>`:
- `themePref.name` → `"theme"`
- `themePref("usr_1")` → `{ type: "theme", id: "usr_1" }`

## API

`list`, `get`, `set`, `setMany`, `reset`. Pass `PreferenceDef`, not a key string.
