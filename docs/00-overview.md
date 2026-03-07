# Vue d'ensemble — Architecture @justwant

## Taxonomie des packages

```
Foundation
  db · plugin · id · crypto · env · lock · retry · event · context · cookie · config

Identity    ← nouveau tier entre Foundation et Building blocks
  user · org

Building blocks
  cron · queue · storage · protect · flag · preference
  consent · permission · audit · webhook · notify
  (permission : architecture inversée — atomes d'abord, rôles composent)

Features
  auth · keys · analytics · monitor · billing · ...
```

## Ordre d'implémentation

| Ordre | Package | Description |
|-------|---------|-------------|
| 01 | `@justwant/db` | Contrats purs, zéro dépendance — base pour tous les adapters |
| 02 | `@justwant/db/drizzle` | Implémentation Drizzle avec mapping |
| 03 | Mapping | Système type-safe de mapping schema utilisateur ↔ contrats |
| 04 | `@justwant/user` | Définition canonique d'un utilisateur — identité seule |
| 05 | `@justwant/org` (org + member) | Organisations et membres |
| 06 | `@justwant/org` (group + member) | Groupes et membres de groupe |
| 07 | `@justwant/permission` (atomic + roles) | createAtomicPermissions, createRoleUniverse |
| 08 | Permission universes | Univers fermés (app, org, group), héritage, scopeId |
| 09 | Permission resolution | Vérification, can/assert/grant/deny, explain |
| 10 | Permission integration | Injection dans user, org, group |
| 11 | Permission mapping | Intents, roles, accesseurs typés (a) => a.member.invite |
| 12 | Stratégie Drizzle | Drizzle first, Prisma en phase 2 |
| 13 | Soft delete | delete=soft, hardDelete=hard pour user, org, member, group |

## Principes clés

1. **User et Org forment la couche Identity** — pas des primitives techniques, pas encore des features métier. Juste la définition canonique de *qui fait quoi* dans le système.

2. **Une seule table `users`** — plus de `auth_users` vs `billing_customers` vs `audit_actors`. Chaque package reçoit une référence, il ne recrée pas ses propres tables.

3. **`@justwant/auth` devient optionnel** — on peut avoir des users sans auth. `@justwant/user` et `@justwant/auth` sont deux packages distincts qui collaborent.

4. **Contrats purs dans `@justwant/db`** — les types Drizzle/Prisma ne franchissent jamais la frontière vers les packages de feature.

5. **Mapping non-invasif** — l'utilisateur mappe son schema existant vers ce qu'attend le package. `@justwant/*` s'adapte à lui, pas l'inverse.

6. **Permissions d'abord** — les atomes (`createAtomicPermissions`) sont purs, les rôles (`createRoleUniverse`) les composent. Un univers = un monde fermé (app, org, group).

7. **Intents fixés, rôles libres** — les intents sont imposés par le package (ex: `member.invite`), les rôles sont libres (owner, billing_manager, etc.). Mapping via accesseurs typés `(a) => a.member.invite`.

8. **Injection directe** — permission est injecté dans user, org, group. Atomicité dans la même transaction — pas d'events asynchrones.
