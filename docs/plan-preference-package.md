# Plan — Package @justwant/preference

> **Note** : Le message initial mentionnait `packages/permission` mais décrit des préférences (definePreference, notifications, thème). Le plan cible `packages/preference`, cohérent avec la taxonomie dans `docs/00-overview.md` (Building blocks: flag, preference, permission).

## 1. Objectifs

- **definePreference** : définition déclarative d’une préférence avec schéma standard (enum, string, bool, etc.)
- **createPreferenceService** : service pour lier des préférences à un **acteur** (agnostic : user, org, group, member, etc.)
- API : list, read, update des préférences d’un acteur
- Cas d’usage typiques : préférences de notification, thème, langue, etc.
- Principes : DX simple, déclaratif, agnostique, indépendance du package, cohérence avec l’écosystème

---

## 2. Patterns observés dans l’écosystème

### 2.1 Définitions déclaratives (defineX)

| Package   | Fonction       | Pattern                                                                 |
|-----------|----------------|-------------------------------------------------------------------------|
| flag      | defineFlag     | `{ id, default, rules, strategy }` → FlagDef                            |
| flag      | defineRule     | `{ id, config?, context?, defaultConfig?, logic }` → RuleDef            |
| waitlist  | defineList     | `{ id, name?, params?, schema?, defaults? }` → WaitlistDef (callable si params) |
| referral  | defineReferralOffer | `{ id, name?, params?, schema?, codeGenerator? }` → ReferralOfferDef (callable) |
| membership| defineGroup    | `{ name, member }` → GroupLike                                          |
| permission| defineActor    | `{ name }` ou `{ from: IdentityLike }` → ActorDef                       |

**Schéma standard** : `StandardSchemaV1` (valibot, zod, etc.) pour validation runtime. Utilisé dans flag (config), waitlist (metadata), job (payload), config.

### 2.2 Repositories

| Package   | Repo interface        | Adapters                                      |
|-----------|-----------------------|-----------------------------------------------|
| flag      | FlagConfigRepo        | createMemoryFlagConfigRepo                    |
| waitlist  | WaitlistRepository    | createMemoryWaitlistAdapter, createWaitlistDbAdapter(table) |
| referral  | ReferralRepository   | createMemoryReferralRepo (si existe), sqliteReferralRepository (e2e) |
| membership| MembershipsRepo      | Aligné sur MappedTable (findOne, findMany, create, update, delete) |

**Pattern DB** : le package expose une interface de repo (contrat). L’utilisateur fournit une implémentation via :
- **Memory** : pour tests/dev
- **DB** : via `createXxxDbAdapter({ table })` où `table` est un `MappedTable` ou interface compatible (create, findOne, findMany, update, delete)

### 2.3 Acteur agnostique

- **waitlist** : `Actor { type, id, orgId? }` — `actorType`, `actorId`, `actorOrgId` en DB
- **permission** : `Actor { type, id }` — `actorType`, `actorId` en DB
- **referral** : `Actor { type, id }` — `referrerType`, `referrerId`, `recipientType`, `recipientId`

**Conclusion** : utiliser un `Actor` générique `{ type, id, orgId? }` pour rester aligné avec waitlist, lock, membership.

### 2.4 Service factory

```ts
createPreferenceService({ preferences: PreferenceDef[], repo: PreferenceRepository })
```

---

## 3. Architecture proposée

### 3.1 Types principaux

```ts
// Actor — aligné waitlist/permission
interface Actor<T extends string = string> {
  type: T;
  id: string;
  orgId?: string;
}

// Préférence persistée
interface PreferenceEntry {
  id: string;
  preferenceKey: string;   // ex: "notifications.email" ou "theme"
  actorType: string;
  actorId: string;
  actorOrgId?: string;
  value: unknown;          // validé par schema
  createdAt: Date;
  updatedAt: Date;
}

// Définition d'une préférence (portable, déclarative)
interface PreferenceDef<T = unknown> {
  readonly id: string;
  readonly key: string;    // clé unique (peut = id)
  readonly schema?: StandardSchemaV1<unknown, T>;
  readonly default?: T;
}

// Repository (contrat)
interface PreferenceRepository {
  create(data: CreateInput<PreferenceEntry>): Promise<PreferenceEntry>;
  findOne(where: Partial<PreferenceEntry>): Promise<PreferenceEntry | null>;
  findMany(where: Partial<PreferenceEntry>, opts?: FindManyOptions): Promise<PreferenceEntry[]>;
  update(id: string, data: Partial<PreferenceEntry>): Promise<PreferenceEntry>;
  delete(id: string): Promise<void>;
}
```

### 3.2 definePreference

```ts
definePreference({
  id: "theme",
  schema: themeSchema,      // StandardSchemaV1<unknown, "light" | "dark" | "system">
  default: "system",
})

definePreference({
  id: "notifications.email",
  schema: booleanSchema,
  default: true,
})
```

**Cas d’usage classiques** :
- `enum` : thème, langue
- `string` : timezone, format date
- `boolean` : notifications email, marketing
- `object` : préférences complexes (ex: `{ digest: "daily" | "weekly", channels: string[] }`)

### 3.3 createPreferenceService

```ts
const service = createPreferenceService({
  preferences: [themePref, notificationsPref],
  repo: preferenceRepo,
});

// List toutes les préférences d'un acteur (avec valeurs actuelles ou default)
await service.list(actor);

// Lire une préférence
await service.get(actor, "theme");  // → "dark" | default

// Update une préférence
await service.set(actor, "theme", "dark");

// Update plusieurs
await service.setMany(actor, { theme: "dark", "notifications.email": false });
```

---

## 4. Structure des fichiers

```
packages/preference/
├── package.json
├── tsconfig.json
├── bunfig.toml
├── README.md
├── CHANGELOG.md
└── src/
    ├── index.ts
    ├── types.ts
    ├── errors.ts
    ├── definePreference.ts
    ├── definePreference.spec.ts
    ├── createPreferenceService.ts
    ├── createPreferenceService.spec.ts
    ├── adapters/
    │   ├── memory.ts          # createMemoryPreferenceAdapter
    │   ├── memory.spec.ts
    │   ├── db.ts              # createPreferenceDbAdapter({ table })
    │   └── db.spec.ts
    └── helpers.ts             # actorKey, validateValue (si besoin)
```

---

## 5. Dépendances

| Dépendance              | Usage                                      |
|-------------------------|--------------------------------------------|
| `@standard-schema/spec` | peer (optional) — validation des valeurs   |
| `@justwant/contract`    | dev — tests, éventuellement defineContract pour adapter DB |

Pas de dépendance à `@justwant/db` dans le core : le package définit uniquement le contrat `PreferenceRepository`. L’adapter `db` utilise une interface `PreferenceTable` compatible avec `MappedTable`.

---

## 6. Adapters

### 6.1 Memory

```ts
createMemoryPreferenceAdapter(): PreferenceRepository
```

- Stockage en mémoire (array)
- Pour tests et développement

### 6.2 DB

```ts
interface PreferenceTable {
  create(data): Promise<PreferenceEntry>;
  findOne(where): Promise<PreferenceEntry | null>;
  findMany(where): Promise<PreferenceEntry[]>;
  update(id, data): Promise<PreferenceEntry>;
  delete(id): Promise<void>;
}

createPreferenceDbAdapter({ table: PreferenceTable }): PreferenceRepository
```

- `table` fourni par l’utilisateur via `@justwant/db` (defineMappedTable + createDrizzleAdapter) ou implémentation custom
- findMany avec orderBy/limit/offset : fallback in-memory si la table ne les supporte pas (comme waitlist)

---

## 7. Intégration avec @justwant/db

L’utilisateur crée sa table et son contrat :

```ts
import { defineContract, field } from "@justwant/contract";
import { defineMappedTable } from "@justwant/db/drizzle";
import { createDrizzleAdapter } from "@justwant/db/drizzle";
import { createPreferenceDbAdapter } from "@justwant/preference/adapters/db";

const PreferenceContract = defineContract({
  id: field<string>().required(),
  preferenceKey: field<string>().required(),
  actorType: field<string>().required(),
  actorId: field<string>().required(),
  actorOrgId: field<string>().optional(),
  value: field<unknown>().required(),  // ou json()
  createdAt: field<Date>().required(),
  updatedAt: field<Date>().required(),
});

const preferencesTable = sqliteTable("preferences", { ... });
const mapped = defineMappedTable(preferencesTable, PreferenceContract, mapping);
const adapter = createDrizzleAdapter(db);
const table = adapter.defineTable(preferencesTable, PreferenceContract, mapping);
const repo = createPreferenceDbAdapter({ table });
```

---

## 8. Cohésion écosystème

| Aspect              | Alignement                                                |
|---------------------|-----------------------------------------------------------|
| Actor               | `{ type, id, orgId? }` comme waitlist, permission         |
| Schema              | `StandardSchemaV1` comme flag, waitlist, config           |
| Repo interface      | create, findOne, findMany, update, delete comme membership |
| Adapter DB          | `{ table }` compatible MappedTable comme waitlist          |
| defineX             | Définition portable, sans runtime                         |
| Errors              | Classes dédiées (PreferenceNotFoundError, etc.)          |

---

## 9. Ordre d’implémentation

1. **types.ts** — Actor, PreferenceEntry, PreferenceDef, PreferenceRepository, FindManyOptions
2. **errors.ts** — PreferenceNotFoundError, PreferenceValidationError
3. **definePreference.ts** — definePreference(config) → PreferenceDef
4. **definePreference.spec.ts**
5. **adapters/memory.ts** — createMemoryPreferenceAdapter
6. **adapters/memory.spec.ts**
7. **createPreferenceService.ts** — list, get, set, setMany
8. **createPreferenceService.spec.ts**
9. **adapters/db.ts** — createPreferenceDbAdapter
10. **adapters/db.spec.ts**
11. **index.ts** — exports
12. **README.md** — documentation, exemples
13. **package.json** — exports, peerDeps

---

## 10. API finale (résumé)

```ts
// Définition
const themePref = definePreference({
  id: "theme",
  schema: themeSchema,
  default: "system",
});

// Service
const service = createPreferenceService({
  preferences: [themePref, notificationsPref],
  repo: createMemoryPreferenceAdapter(), // ou createPreferenceDbAdapter({ table })
});

// Usage
await service.list(actor);                    // [{ key, value }, ...]
await service.get(actor, "theme");             // "dark" | default
await service.set(actor, "theme", "dark");
await service.setMany(actor, { theme: "dark", "notifications.email": false });
await service.reset(actor, "theme");           // optionnel : remet au default
```

---

## 11. Extensions possibles (hors scope v1)

- **Plugins** : audit, validation custom (comme referral, waitlist)
- **Namespacing** : `preferenceKey` avec namespace (ex: `app:theme`, `org:branding`)
- **Bulk** : setMany déjà prévu ; listMany(actors) si besoin
- **Migration** : pas dans le package ; l’utilisateur gère son schéma DB
