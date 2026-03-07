# 02 — @justwant/adapter/drizzle — Implémentation Drizzle

## Objectif

Package qui **étend** `@justwant/adapter` avec une implémentation concrète pour Drizzle ORM. Supporte pg, mysql, sqlite via le même contrat.

## Ce qu'il expose

```ts
export {
  createDrizzleAdapter,
  defineMappedTable,
  buildWhere,
  buildOrderBy,
  buildPagination,
  upsert,
  bulkInsert,
  collectSchemas,
  generateMigration,
  type DrizzleClient,
  type DrizzleAdapter,
  type TableMapping,
}
```

## DrizzleClient

```ts
type DrizzleClient =
  | NodePgDatabase<any>
  | MySql2Database<any>
  | BetterSQLite3Database<any>
```

Un seul contrat d'adapter → couverture de toutes les bases relationnelles supportées par Drizzle.

## DrizzleMappedTable

```ts
export interface DrizzleMappedTable<TTable extends Table, TContract extends AnyContract>
  extends MappedTable<TContract> {
  _internal: MappedTableInternal<TContract> & {
    source:  TTable
    mapping: MappingFor<TTable, TContract>
    client:  DrizzleClient
  }
}
```

## Usage par un package de feature

```ts
// @justwant/auth/adapters/drizzle.ts
import { createDrizzleAdapter } from '@justwant/adapter/drizzle'
import type { AuthAdapter } from '@justwant/auth'

export function drizzleAuthAdapter(
  db: DrizzleClient,
  tables: { users: MappedTable | PgTable }
): AuthAdapter {
  const adapter = createDrizzleAdapter(db, tables)

  return {
    async findUserByEmail(email) {
      return adapter.findOne(tables.users, { email })
    },
    async createUser(data) {
      return adapter.create(tables.users, data)
    },
    // ...
  }
}
```

## Tables propres vs tables mappées

| Type | Exemple | Source |
|------|---------|--------|
| **Tables propres** | `sessions`, `api_keys`, `audit_events` | Définies par `@justwant/*`, importées depuis le package |
| **Tables partagées** | `users`, `organizations`, `members` | Appartiennent à l'utilisateur, mappées via `defineMappedTable()` |

## Escape hatch ._internal

```ts
users._internal.adapter        // instance pgUsersAdapter
users._internal.schema         // schema résolu
users._internal.tableName      // 'users'
users._internal.adapter.client // Pool pg — accès direct

// SQL pré-construit
users._internal.adapter.sql.findById(id)
// → { text: 'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL', values: [id] }
```
