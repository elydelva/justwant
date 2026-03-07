# 09 — Résolution et vérification des permissions

## Ordre de priorité

```
1. Override explicite deny  → false immédiat
2. Override explicite grant → true immédiat
3. Rôle de l'user dans le scope → vérifie ses permissions résolues (avec ceiling)
4. → false
```

## API de vérification

```ts
// Vérification
permission.app.can(userId, 'billing:view')
permission.org.can(userId, 'document:write', { scopeId: orgId })
permission.group.can(userId, 'document:read', { scopeId: groupId })

// Assert — throw PermissionDeniedError si false
await permission.org.assert(userId, 'document:delete', { scopeId: orgId })
await permission.org.assert(userId, 'billing:edit', { scopeId: orgId }, {
  message: 'You need billing access to edit this plan',
})

// Assignation des rôles
permission.app.roles.assign(userId, 'admin')
permission.org.roles.assign(userId, 'member', { scopeId: orgId })
permission.group.roles.assign(userId, 'lead', { scopeId: groupId })

// Has role
permission.org.roles.has(userId, 'owner', { scopeId: orgId })
permission.org.roles.revoke(userId, { scopeId: orgId })
```

## Grants directs — indépendants des rôles

```ts
// Donner une permission spécifique sans changer le rôle
await permission.org.grant(userId, 'document:publish', { scopeId: orgId })

// Bloquer une permission même si le rôle la donne
await permission.org.deny(userId, 'member:remove', { scopeId: orgId })

// Révoquer
await permission.org.revokeGrant(userId, 'document:publish', { scopeId: orgId })
await permission.org.revokeDeny(userId, 'member:remove', { scopeId: orgId })
```

## Helpers DX

```ts
// Toutes les permissions requises
await permission.org.canAll(userId, ['document:write', 'document:publish'], { scopeId: orgId })

// Au moins une permission
await permission.org.canAny(userId, ['document:write', 'document:delete'], { scopeId: orgId })

// Bulk
await permission.org.canMany([userId1, userId2], 'document:read', { scopeId: orgId })
// → Map<string, boolean>
```

## explain — debug

```ts
await permission.org.explain(userId, 'document:publish', { scopeId: orgId })
// {
//   result:  false,
//   reason:  'role',
//   role:    'member',
//   missing: 'document:publish not in OrgRoles.resolved["member"]',
//   grants:  [],
//   denies:  [],
// }

await permission.org.explain(userId, 'document:write', { scopeId: orgId })
// {
//   result:  true,
//   reason:  'role',
//   role:    'admin',
// }

await permission.org.explain(userId, 'document:publish', { scopeId: orgId })
// {
//   result:  true,
//   reason:  'grant',   ← vient d'un grant direct
//   grantedAt: '2025-01-15',
//   grantedBy: 'usr_admin123',
// }
```

## Sans rôles — permission pure

```ts
// Univers sans rôles — grants directs uniquement
export const permission = createPermission({
  adapter: pgPermissionAdapter(pool),
  universes: {
    app: { permissions: AppPermissions },   // pas de roles
  },
})

permission.app.can(userId, 'billing:view')
// → vérifie uniquement les grants explicites

permission.app.roles   // ✗ TypeScript error — roles non déclaré
```
