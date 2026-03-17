# @justwant/preference

Préférences utilisateur avec schéma typé. Définition déclarative, acteur agnostique, stockage via repository.

## Installation

```bash
bun add @justwant/preference
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

- **definePreference** — Définition déclarative d'une préférence (id, key?, schema?, default?)
- **createPreferenceService** — Service avec list, get, set, setMany, reset (on passe la définition `PreferenceDef`, pas la clé)
- **createMemoryPreferenceAdapter** — Stockage en mémoire (tests/dev)
- **createPreferenceDbAdapter** — Stockage DB via table compatible MappedTable (voir `@justwant/preference/adapters/db`)

## Actor

L'identité utilise `Actor` de `@justwant/actor` : `{ type, id, within? }`. Les préférences sont isolées par acteur ; un acteur avec `within: { type: "org", id: "org-1" }` a des préférences distinctes de l'acteur sans `within`.

## Validation

Les schémas doivent implémenter `StandardSchemaV1` (valibot, zod, etc.). La validation est optionnelle ; sans schéma, toute valeur est acceptée.
