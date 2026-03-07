# 06 — @justwant/org — Groupes et membres de groupe

## Objectif

Groupes au sein d'une organisation et leurs membres. Second niveau — un groupe appartient à une org et a ses propres membres/rôles. Les groupes partagent le modèle de membre avec l'org (même package).

## Types

```ts
type Group = {
  id:        string        // grp_01J8X
  orgId:     string        // un groupe appartient à une org
  name:      string
  slug:      string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date         // soft delete
}

type GroupMember = {
  userId:    string
  groupId:   string
  role:      string        // 'lead' | 'member' — ou même que l'org
  joinedAt:  Date
  deletedAt?: Date         // soft delete — membre retiré sans supprimer l'historique
}
```

## CLI — init (partie groups)

```bash
npx @justwant/org init
```

```
? Enable groups?               › Yes
? Group roles (or same as org) › lead, member
```

## Schema — groups

```ts
// src/lib/org/schema.ts — extension
export const Org = defineOrg({
  roles: ['owner', 'admin', 'member', 'viewer'] as const,
  softDelete: true,   // groups et group_members supportent le soft delete
  groups: {
    enabled: true,
    roles: ['lead', 'member'] as const,
  },
  // ...
})
```

## API — groupes et membres de groupe

```ts
import { org } from '~/lib/org'

// Groupes
org.groups.create(orgId, { name: 'Engineering', slug: 'engineering' })
org.groups.findById(groupId)
org.groups.getByOrg(orgId)
org.groups.update(groupId, { name: 'Product' })
org.groups.delete(groupId)

// Membres de groupe
org.groups.addMember(groupId, userId, 'lead')
org.groups.removeMember(groupId, userId)      // soft — pose deletedAt
org.groups.hardRemoveMember(groupId, userId)  // hard — DELETE
org.groups.restoreMember(groupId, userId)     // annule le soft remove
org.groups.updateRole(groupId, userId, 'member')
org.groups.getMembers(groupId)
org.groups.isMember(groupId, userId)
org.groups.hasRole(groupId, userId, 'lead')
```

## Soft delete

### Groupe

```ts
// delete() — soft delete
await org.groups.delete(groupId)
// → UPDATE groups SET deleted_at = now() WHERE id = groupId
// → permission.group.revokeScope(groupId)

// restore() — annule le soft delete
await org.groups.restore(groupId)

// hardDelete() — suppression définitive
await org.groups.hardDelete(groupId)
```

### Membre de groupe

```ts
// removeMember() — soft (pose deletedAt)
await org.groups.removeMember(groupId, userId)
// → UPDATE group_members SET deleted_at = now() WHERE ...
// → permission.group.roles.revoke(userId, { scopeId: groupId })

// hardRemoveMember() — hard (DELETE définitif)
await org.groups.hardRemoveMember(groupId, userId)
// → DELETE FROM group_members WHERE ...

// restoreMember() — réintègre un membre soft-removed
await org.groups.restoreMember(groupId, userId)
```

`getMembers`, `isMember` excluent les membres soft-removed par défaut.

## Fichiers générés (avec groups)

```
src/lib/org/
├── schema.ts          ← org + member + groups
├── adapter.ts
├── index.ts
└── migrations/
    ├── 001_create_org_tables.sql
    └── 002_create_group_tables.sql
```

## Re-génération

```bash
npx @justwant/org migrate --from ./src/lib/org/schema.ts
# → src/lib/org/migrations/002_add_org_avatar.sql
```
