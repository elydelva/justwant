# 08 — Univers fermés et scopeId

## Principe

Un univers est un monde fermé. Ses permissions n'existent que dans son contexte. Deux univers ne se connaissent pas — ils peuvent seulement déclarer qu'un rôle d'un autre univers sert de plafond (ceiling).

```
AppUniverse     → permissions + rôles de l'application entière
OrgUniverse     → permissions + rôles dans le contexte d'une organisation
GroupUniverse   → permissions + rôles dans le contexte d'un groupe
```

## Héritage — Group → Org → App

Chaque niveau peut restreindre — jamais élargir au-delà du parent.

```
app:member
  └── org:member        (peut avoir moins, jamais plus qu'app:member)
        └── group:member (peut avoir moins, jamais plus qu'org:member)
```

Le `ceiling` déclare le plafond :

```ts
// Org plafonné par App
ceiling: { universe: AppRoles, map: { owner: 'admin', admin: 'member', member: 'member', viewer: 'viewer' } }

// Group plafonné par Org
ceiling: { universe: OrgRoles, map: { lead: 'member', member: 'member', viewer: 'viewer' } }
```

## scopeId — identifiant unifié

Le contexte est déjà porté par le namespace `permission.group`, `permission.org`. Répéter `groupId`, `orgId` est redondant.

```ts
// Avant — redondant
permission.group.can(userId, 'document:write', { groupId: groupB })
permission.org.can(userId, 'document:publish', { orgId: orgA })

// Après — le contexte est dans le namespace, l'id est juste un id
permission.group.can(userId, 'document:write', { scopeId: groupB })
permission.org.can(userId, 'document:publish', { scopeId: orgA })
permission.app.can(userId, 'billing:view')   // pas de scopeId — app est global
```

## scoped — typage conditionnel

```ts
export const AppRoles = createRoleUniverse({
  name:    'app',
  scoped:  false,       // global — pas de scopeId
  // ...
})

export const OrgRoles = createRoleUniverse({
  name:    'org',
  scoped:  true,        // scopeId requis
  // ...
})
```

TypeScript enforce la présence ou l'absence de scopeId :

```ts
// Univers global — scopeId interdit
permission.app.can(userId, 'billing:view')
permission.app.can(userId, 'billing:view', { scopeId: orgA })
// ✗ Argument of type '{ scopeId: string }' is not assignable to type 'never'

// Univers scoped — scopeId requis
permission.org.can(userId, 'document:read')
// ✗ Argument of type '{}' is missing property 'scopeId'

permission.org.can(userId, 'document:read', { scopeId: orgA })
// ✓
```

## Chaîne d'héritage visuelle

```
app:superadmin  ──────────────────────────── Permission.all()
app:admin       ──────────────────────────── Permission.all() \ {dangerZone}
app:moderator   ────────────────────────┐
app:member      ──────────────────┐     │
app:viewer      ────────────┐     │     │
                            │     │     │
                     org:viewer   │     │
                     [doc:read]   │     │
                                  │     │
                          org:member   org:admin
                               │
                        group:viewer  group:member  group:lead
```
