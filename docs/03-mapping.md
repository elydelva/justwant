# 03 — Mapping type-safe — defineMappedTable

## Problème résolu

L'utilisateur a déjà son schema Drizzle. Il ne veut pas une table `users` séparée — il veut **mapper** son schema existant vers ce que le package attend.

```ts
// Ce que l'utilisateur a
export const accounts = pgTable('accounts', {
  id:       uuid('id').primaryKey(),
  mail:     text('mail').notNull(),      // 'mail' pas 'email'
  fullName: text('full_name'),           // 'fullName' pas 'name'
  isAdmin:  boolean('is_admin'),
})

// Ce que @justwant/auth attend
type UserRecord = {
  id:             string
  email:          string
  emailVerified:  boolean
  name?:          string
  createdAt:      Date
}
```

## Contrat déclaré par le package

```ts
// @justwant/auth/contract.ts
import { defineContract, field } from '@justwant/adapter'

export const UserContract = defineContract({
  id:             field<string>().required(),
  email:          field<string>().required(),
  emailVerified:  field<boolean>().required(),
  createdAt:      field<Date>().required(),
  name:           field<string>().optional(),
})
```

## defineMappedTable — usage

```ts
import { defineMappedTable } from '@justwant/adapter/drizzle'
import { UserContract } from '@justwant/auth'
import { accounts } from './db/schema'

// ✅ Mapping correct
const mappedUsers = defineMappedTable(accounts, UserContract, {
  id:             accounts.id,
  email:          accounts.mail,
  emailVerified:  accounts.isVerified,
  createdAt:      accounts.createdAt,
  name:           accounts.fullName,    // optionnel — peut être omis
})
```

## Vérifications TypeScript

| Cas | Résultat |
|-----|----------|
| Champ requis manquant | Erreur de compilation |
| Type incompatible (string → boolean) | Erreur de compilation |
| Champ optionnel omis | OK |
| Colonne nullable pour champ optionnel | OK (null → undefined à la lecture) |

## MappingFor — types internes

```ts
type ColData<C extends Column> = C['_']['data']

type ColsFor<TTable extends Table, T> = {
  [K in keyof TTable['_']['columns']]:
    ColData<TTable['_']['columns'][K]> extends T
      ? TTable['_']['columns'][K]
    : ColData<TTable['_']['columns'][K]> extends T | null
      ? TTable['_']['columns'][K] & { _nullable: true }
    : never
}[keyof TTable['_']['columns']]

type MappingFor<TTable extends Table, TContract extends AnyContract> =
  RequiredMapping<TTable, TContract> & OptionalMapping<TTable, TContract>
```

## Dialectes Drizzle (pg, mysql, sqlite)

Drizzle expose la même interface `Column` — `ColData<C>` fonctionne partout. Attention aux types spécifiques :

- **MySQL** : `tinyint` → `number` (pas `boolean`) — utiliser `tinyint({ mode: 'boolean' })`
- **SQLite** : `integer` avec `mode: 'boolean'` ou `mode: 'timestamp'` pour les conversions

## CLI — proposition automatique

```bash
npx justwant add auth
```

```
Scanning your Drizzle schema...

Found table "accounts" — possible match for @justwant/auth users table

  accounts.id        → User.id            ✓ compatible (uuid)
  accounts.mail      → User.email         ? renamed  (text)
  accounts.full_name → User.name          ? renamed  (text)
  accounts.is_admin  → User.emailVerified ? type mismatch
  accounts.created_at→ User.createdAt     ✓ compatible (timestamp)

  Missing: User.emailVerified — add to accounts or create new column?
  › Map to existing column / Add column / Skip

? Use "accounts" as your users table? › Yes
```

Génère ensuite `schema.ts`, `adapter.ts`, et les migrations delta uniquement.
