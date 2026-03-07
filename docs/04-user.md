# 04 — @justwant/user — Identité utilisateur

## Objectif

La **définition canonique** d'un utilisateur dans l'écosystème. Pas un système d'auth — juste l'identité. Permet d'avoir des users sans les citer directement partout.

## Type de base

```ts
type User = {
  id:            string        // usr_01J8X — généré par @justwant/id
  email:         string
  emailVerified: boolean
  name?:         string
  avatarUrl?:    string
  metadata?:     Record<string, unknown>
  createdAt:     Date
  updatedAt:     Date
  deletedAt?:   Date          // soft delete natif
}
```

## Définition par schema (defineUser)

```ts
// user.config.ts
import { defineUser } from '@justwant/user'
import * as v from 'valibot'

export const User = defineUser({
  fields: {
    name:     v.optional(v.string()),
    avatarUrl: v.optional(v.pipe(v.string(), v.url())),
    role:     v.picklist(['admin', 'user', 'guest']),
    locale:   v.pipe(v.string(), v.maxLength(10)),
    plan:     v.picklist(['free', 'pro', 'team']),
  },
  softDelete: true,
  timestamps: true,
})

export type UserType = typeof User.infer
```

## API

```ts
import { createUsers } from '@justwant/user'
import { pgUsersAdapter } from '@justwant/user/adapters/pg'

const users = createUsers({
  schema:  User,
  adapter: pgUsersAdapter(pool),
})

users.create({ email, name })
users.findById(id)
users.findByEmail(email)
users.update(id, { name, avatarUrl })
users.delete(id)              // soft delete par défaut
users.hardDelete(id)           // suppression définitive — RGPD
users.restore(id)             // restaure après soft delete
users.findMany({ where: { plan: 'pro', role: 'admin' } })
```

## Plugins

```ts
import { profilePlugin } from '@justwant/user/plugin-profile'
import { metadataPlugin } from '@justwant/user/plugin-metadata'
import { impersonatePlugin } from '@justwant/user/plugin-impersonate'

const users = createUsers({
  adapter: pgUsersAdapter(pool),
  plugins: [
    profilePlugin({
      fields: {
        bio:      z.string().max(500).optional(),
        phone:    z.string().optional(),
        timezone: z.string().default('UTC'),
        locale:   z.string().default('en'),
      },
    }),
    metadataPlugin(),
    impersonatePlugin(),
  ],
})
```

## Consommation par les autres packages

```ts
// @justwant/audit
const audit = createAudit({
  adapter: pgAuditAdapter(pool),
  users,   // référence optionnelle — enrichit à la lecture
})

// @justwant/keys
const keys = createKeys({
  adapter: pgKeysAdapter(pool),
  users,   // valide que l'ownerId existe
  org,
})

// @justwant/billing
const billing = createBilling({
  adapter: pgBillingAdapter(pool),
  users,
  org,
})
```

## Soft delete

```ts
// Configuration — activé par défaut
const User = defineUser({
  softDelete: true,   // pose deletedAt au lieu de supprimer
  // ...
})

// delete() — soft delete
await users.delete(userId)
// → UPDATE users SET deleted_at = now() WHERE id = userId
// → les requêtes par défaut excluent deleted_at IS NOT NULL

// restore() — annule le soft delete
await users.restore(userId)
// → UPDATE users SET deleted_at = null WHERE id = userId

// hardDelete() — suppression définitive (RGPD)
await users.hardDelete(userId)
// → DELETE FROM users WHERE id = userId
```

`findById`, `findByEmail`, `findMany` excluent automatiquement les enregistrements soft-deleted. Pour inclure les supprimés : `users.findMany({ includeDeleted: true })`.

## RGPD — hardDelete

```ts
await users.hardDelete(userId)

// @justwant/event propage 'user.deleted'
// → audit anonymise les entrées
// → keys révoque toutes les clés
// → billing annule les abonnements
// → consent supprime les preuves
// → analytics anonymise les events
// → sessions invalidées par auth
```
