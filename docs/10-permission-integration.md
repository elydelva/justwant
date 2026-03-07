# 10 — Intégration permission dans user, org, group

## Principe — injection directe

`@justwant/permission` ne connaît pas user, org, group. C'est l'inverse — **permission est injecté** dans user, org, group. Ils appellent permission directement, dans la même transaction. Atomicité garantie.

```
user  → dépend de permission (injecté)
org   → dépend de permission (injecté)
group → dépend de permission (injecté)
permission → dépend de personne
```

## org — addMember / removeMember / updateRole

```ts
export const org = createOrg({
  schema:  Org,
  adapter: pgOrgAdapter(pool),

  permission: {
    instance: permission.org,
    intents: { /* voir 11-permission-mapping */ },
    roles:   { /* voir 11-permission-mapping */ },
  },
})

// addMember — assigne le rôle ET la permission dans la même transaction
await org.addMember(orgId, userId, 'admin')
// → tx.begin()
// → INSERT INTO org_members (org_id, user_id, role) VALUES (...)
// → permission.org.roles.assign(userId, 'admin', { scopeId: orgId })
// → tx.commit()

// removeMember — soft, révoque automatiquement
await org.removeMember(orgId, userId)
// → tx.begin()
// → UPDATE org_members SET deleted_at = now() WHERE ...
// → permission.org.roles.revoke(userId, { scopeId: orgId })
// → tx.commit()

// hardRemoveMember — hard, DELETE
await org.hardRemoveMember(orgId, userId)
// → DELETE FROM org_members WHERE ...

// restoreMember — ré-assigne le rôle
await org.restoreMember(orgId, userId)
// → permission.org.roles.assign(userId, role, { scopeId: orgId })

// delete org — révoque tout le scope
await org.delete(orgId)
// → permission.org.revokeScope(orgId)
```

## group — même pattern

```ts
export const group = createGroup({
  schema:  Group,
  adapter: pgGroupAdapter(pool),

  permission: {
    instance: permission.group,
    intents: { /* ... */ },
    roles:   { /* ... */ },
  },
})

await group.addMember(groupId, userId, 'lead')
// → INSERT + permission.group.roles.assign()

await group.removeMember(groupId, userId)
// → soft (deletedAt) + permission.group.roles.revoke()

await group.hardRemoveMember(groupId, userId)
// → DELETE FROM group_members WHERE ...

await group.restoreMember(groupId, userId)
// → permission.group.roles.assign()

await group.delete(groupId)
// → permission.group.revokeScope(groupId)
```

## user — onCreate, onHardDelete, onSoftDelete

```ts
export const users = createUsers({
  schema:  User,
  adapter: pgUsersAdapter(pool),

  permission: {
    instance: permission,

    onCreate: {
      assign: permission.app.role.member,   // rôle app par défaut
    },

    onHardDelete: {
      revokeAll: true,   // permission.revokeAll(userId)
    },

    onSoftDelete: {
      suspend: true,     // permission.suspendAll(userId) — permissions en pause
    },
  },
})

// Suspension — ban temporaire
await users.suspend(userId)
// → deletedAt = now
// → permission.suspendAll(userId)

await users.restore(userId)
// → deletedAt = null
// → permission.restoreAll(userId)
```

