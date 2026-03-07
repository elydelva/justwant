# 07 — @justwant/permission — Atomes et rôles

## Architecture inversée — permissions d'abord

Aucune notion de rôle dans les atomes. Juste des actions déclarées, organisées en domaines. Les rôles composent les permissions — pas l'inverse.

```
Atomic  →  Unité de capacité       createAtomicPermissions()
Role    →  Composition des atomes   createRoleUniverse()
Permission → Résolution runtime     createPermission()
```

## createAtomicPermissions — atomes purs

```ts
import {
  createAtomicPermissions,
  createRoleUniverse,
  createPermission,
} from '@justwant/permission'

export const AppPermissions = createAtomicPermissions({
  name: 'app',
  domains: {
    user:     { read: true, create: true, delete: true, impersonate: true },
    billing:  { view: true, edit: true, cancelPlan: true },
    settings: { view: true, edit: true, dangerZone: true },
    audit:    { view: true, export: true },
  },
})

export const OrgPermissions = createAtomicPermissions({
  name: 'org',
  domains: {
    document: { read: true, write: true, delete: true, publish: true },
    member:   { view: true, invite: true, remove: true, promote: true },
    settings: { view: true, edit: true },
    billing:  { view: true, downloadInvoice: true },
  },
})

export const GroupPermissions = createAtomicPermissions({
  name: 'group',
  domains: {
    document: { read: true, write: true, delete: true },
    member:   { view: true, invite: true },
  },
})
```

## createRoleUniverse — compose les permissions

```ts
export const AppRoles = createRoleUniverse({
  name:        'app',
  scoped:      false,
  permissions: AppPermissions,
  roles: {
    superadmin:      { permissions: AppPermissions.all() },
    admin:           { permissions: AppPermissions.all(), except: ['settings:dangerZone', 'user:impersonate'] },
    billing_manager: { permissions: [AppPermissions.domain('billing'), 'audit:view'] },
    member:          { permissions: ['user:read', 'billing:view', 'settings:view'] },
    viewer:          { permissions: ['user:read', 'settings:view'] },
  },
})

export const OrgRoles = createRoleUniverse({
  name:        'org',
  scoped:      true,
  permissions: OrgPermissions,
  ceiling:     { universe: AppRoles, map: { owner: 'admin', admin: 'member', member: 'member', viewer: 'viewer' } },
  roles: {
    owner:  { permissions: OrgPermissions.all() },
    admin:  { permissions: [OrgPermissions.domain('document'), OrgPermissions.domain('member'), 'settings:view', 'settings:edit'] },
    member: { permissions: ['document:read', 'document:write', 'member:view', 'settings:view'] },
    viewer: { permissions: ['document:read', 'member:view'] },
  },
})

export const GroupRoles = createRoleUniverse({
  name:        'group',
  scoped:      true,
  permissions: GroupPermissions,
  ceiling:     { universe: OrgRoles, map: { lead: 'member', member: 'member', viewer: 'viewer' } },
  roles: {
    lead:   { permissions: [GroupPermissions.domain('document'), 'member:invite', 'member:view'] },
    member: { permissions: ['document:read', 'document:write', 'member:view'] },
    viewer: { permissions: ['document:read', 'member:view'] },
  },
})
```

## Types inférés

```ts
type AppPerm   = typeof AppPermissions.infer
// 'user:read' | 'user:create' | ... | 'billing:view' | ...

type OrgPerm   = typeof OrgPermissions.infer
// 'document:read' | 'document:write' | ... | 'member:invite' | ...

type GroupPerm = typeof GroupPermissions.infer
// 'document:read' | 'document:write' | 'document:delete' | 'member:view' | 'member:invite'

// 'document:read' dans OrgPermissions ≠ 'document:read' dans GroupPermissions
// même string, univers différents — pas interchangeables
```

## Structure du package

```
@justwant/permission

  createAtomicPermissions(config)
  → monde fermé de permissions
  → aucune notion de rôle

  createRoleUniverse(config)
  → rôles qui composent des permissions d'un univers
  → ceiling optionnel vers un autre univers
  → dépend d'un AtomicPermissions, pas de createPermission

  createPermission(config)
  → instance finale
  → reçoit N univers, chacun avec permissions + rôles optionnels
  → expose permission.app / permission.org / permission.group
```
