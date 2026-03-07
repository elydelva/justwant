# 05 — @justwant/org — Organisation et membres

## Objectif

Organisations et leurs membres. Premier niveau de la couche org — une org a des membres avec des rôles. Génération par CLI car les rôles et champs custom varient d'un projet à l'autre.

## Types

```ts
type Organization = {
  id:        string        // org_01J8X
  slug:      string        // 'acme-corp' — unique, URL-safe
  name:      string
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date         // soft delete
}

type Member = {
  userId:    string
  orgId:     string
  role:      string        // 'owner' | 'admin' | 'member' | 'viewer'
  joinedAt:  Date
  deletedAt?: Date         // soft delete — membre retiré sans supprimer l'historique
}
```

## CLI — init (partie org + member)

```bash
npx @justwant/org init
```

```
? Organization model name      › Organization
? Member roles                 › owner, admin, member, viewer
? Adapter                      › pg | mysql | sqlite | prisma | drizzle
? Output directory             › ./src/lib/org
```

## Schema — org et member

```ts
// src/lib/org/schema.ts
import { defineOrg } from '@justwant/org'

export const Org = defineOrg({
  roles: ['owner', 'admin', 'member', 'viewer'] as const,
  softDelete: true,   // org et members supportent le soft delete
  fields: {
    plan:      'free' as 'free' | 'pro' | 'enterprise',
    avatarUrl: undefined as string | undefined,
  },
  memberFields: {
    title:     undefined as string | undefined,
    invitedBy: undefined as string | undefined,
  },
})

export type OrgRole    = typeof Org.roles[number]
export type OrgType    = typeof Org.infer
export type MemberType = typeof Org.inferMember
```

## API — org et membres

```ts
import { org } from '~/lib/org'

// Orgs
org.create({ name: 'Acme', slug: 'acme', plan: 'pro' })
org.findBySlug('acme')
org.update(id, { plan: 'enterprise' })

// Membres — rôles typés
org.addMember(orgId, userId, 'admin')
org.removeMember(orgId, userId)       // soft — pose deletedAt
org.hardRemoveMember(orgId, userId)   // hard — DELETE
org.restoreMember(orgId, userId)      // annule le soft remove
org.updateRole(orgId, userId, 'viewer')
org.hasRole(orgId, userId, 'owner')
org.getMembers(orgId)
org.getMemberships(userId)
org.isMember(orgId, userId)
```

## Soft delete

### Organisation

```ts
// Configuration
const Org = defineOrg({
  softDelete: true,   // pose deletedAt au lieu de supprimer
  // ...
})

// delete() — soft delete
await org.delete(orgId)
// → UPDATE organizations SET deleted_at = now() WHERE id = orgId
// → permission.org.revokeScope(orgId)

// restore() — annule le soft delete
await org.restore(orgId)

// hardDelete() — suppression définitive
await org.hardDelete(orgId)
```

### Membre

```ts
// removeMember() — soft (pose deletedAt)
await org.removeMember(orgId, userId)
// → UPDATE org_members SET deleted_at = now() WHERE ...
// → permission.org.roles.revoke(userId, { scopeId: orgId })

// hardRemoveMember() — hard (DELETE définitif)
await org.hardRemoveMember(orgId, userId)
// → DELETE FROM org_members WHERE org_id = orgId AND user_id = userId

// restoreMember() — réintègre un membre soft-removed
await org.restoreMember(orgId, userId)
// → UPDATE org_members SET deleted_at = null WHERE ...
// → permission.org.roles.assign(userId, role, { scopeId: orgId })
```

`getMembers`, `getMemberships`, `isMember` excluent les membres soft-removed par défaut. `getMembers({ includeDeleted: true })` pour inclure.

## Escape hatch ._internal

```ts
org._internal.schema
org._internal.adapter
org._internal.roles
org._internal.adapter.sql.findMembers(orgId)
```
