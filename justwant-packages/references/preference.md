# @justwant/preference

User preferences. definePreference, createPreferenceService. Actor-agnostic.

## Usage

```ts
import { definePreference, createPreferenceService, createMemoryPreferenceAdapter } from "@justwant/preference";

const themePref = definePreference({ id: "theme", default: "system" });
const service = createPreferenceService({
  preferences: [themePref],
  repo: createMemoryPreferenceAdapter(),
});

const user = { type: "user" as const, id: "usr_1" };
await service.set(user, themePref, "dark");
const theme = await service.get(user, themePref);
const all = await service.list(user);
await service.reset(user, themePref);
```

## API

list, get, set, setMany, reset. Pass PreferenceDef, not key string.
