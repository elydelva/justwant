# 11 — Mapping des permissions — intents et rôles

## Intents — fixés par le package

Les intents sont **définis et requis** par le package. `@justwant/org` sait qu'il a besoin de "quelque chose pour inviter" — c'est son contrat interne. Tu ne peux pas en ajouter, tu ne peux pas en supprimer. TypeScript error si un requis manque.

## Roles — libres

Les rôles sont **libres** — tu mets autant de rôles que tu veux, avec les noms que tu veux. `@justwant/org` ne sait pas ce qu'est un owner ou un billing_manager. Il sait juste que quand tu appelles `addMember(orgId, userId, 'billing_manager')`, il doit résoudre ça vers un rôle permission.

## Accesseurs typés — atomic et role

```ts
// permission.org.atomic — miroir de OrgPermissions.domains
permission.org.atomic.document.read     // → 'document:read'
permission.org.atomic.document.write    // → 'document:write'
permission.org.atomic.member.invite     // → 'member:invite'
permission.org.atomic.settings.edit     // → 'settings:edit'

// permission.org.role — miroir de OrgRoles.roles
permission.org.role.owner               // → 'owner'
permission.org.role.admin               // → 'admin'
permission.org.role.member              // → 'member'

// Erreur — accès inexistant
permission.org.atomic.document.fly      // ✗ Property 'fly' does not exist
permission.org.role.superadmin          // ✗ 'superadmin' n'est pas un OrgRole
```

## Mapping avec callbacks — (a) => a.member.invite

On passe l'accesseur en callback — plus besoin de répéter `permission.org.atomic` partout.

```ts
export const org = createOrg({
  schema:  Org,
  adapter: pgOrgAdapter(pool),

  permission: {
    instance: permission.org,

    // Intents — exhaustifs, imposés par @justwant/org
    intents: {
      'member.invite':  (a) => a.member.invite,
      'member.remove':  (a) => a.member.remove,
      'member.promote': (a) => a.member.promote,
      'org.delete':     (a) => a.settings.edit,
      'org.settings':   (a) => a.settings.edit,
      'member.view':    (a) => a.member.view,
    },

    // Roles — libres, objet direct (pas de fonction)
    roles: {
      owner:           (r) => r.owner,
      admin:           (r) => r.admin,
      billing_manager: (r) => r.admin,    // rôle custom → mappé vers admin
      moderator:       (r) => r.member,   // rôle custom → mappé vers member
      member:          (r) => r.member,
      readonly:        (r) => r.viewer,
      guest:           (r) => r.viewer,
    },
  },
})
```

## Résolution à l'init

Les fonctions sont appelées **une seule fois** à l'init pour résoudre les valeurs — pas à chaque vérification.

```ts
const resolvedIntents = mapValues(intents, (fn) => fn(permission.org.atomic))
const resolvedRoles   = mapValues(roles,   (fn) => fn(permission.org.role))
```

## Comment org utilise les intents

```ts
// @justwant/org — interne
async function addMember(orgId: string, userId: string, role: OrgRole) {
  await tx(async (trx) => {
    // 1. Vérifier si l'acteur a la permission pour inviter
    await this.permission.instance.assert(
      this.context.actorId,
      this.permission.intents['member.invite'],  // résolu depuis le mapping
      { scopeId: orgId }
    )

    // 2. Insérer le membre
    await trx.insert(orgMembers).values({ orgId, userId, role })

    // 3. Assigner le rôle permission
    const permRole = this.permission.roles[role](permission.org.role)
    await this.permission.instance.roles.assign(userId, permRole, { scopeId: orgId })
  })
}
```

## user et group — même pattern

```ts
export const users = createUsers({
  permission: {
    instance: permission,
    intents: {
      'user.create':     (a) => a.user.create,
      'user.delete':     (a) => a.user.delete,
      'user.impersonate': (a) => a.user.impersonate,
    },
    onCreate: {
      assign: (r) => r.member,   // permission.app.role.member
    },
  },
})

export const group = createGroup({
  permission: {
    instance: permission.group,
    intents: {
      'member.invite': (a) => a.member.invite,
      'member.remove': (a) => a.member.remove,
      'group.delete':  (a) => a.document.delete,
    },
    roles: {
      lead:   (r) => r.lead,
      member: (r) => r.member,
      viewer: (r) => r.viewer,
    },
  },
})
```
