# 13 — Soft delete — Vue d'ensemble

## Principe

Toutes les entités Identity supportent le soft delete : `deletedAt` au lieu de suppression physique. Permet l'audit, la restauration, la conformité RGPD (conservation temporaire avant purge).

## Récapitulatif par entité

| Entité | delete() | hardDelete() | restore() | Config |
|--------|----------|--------------|-----------|--------|
| **User** | pose `deletedAt` | `DELETE` définitif | annule soft delete | `softDelete: true` dans defineUser |
| **Organization** | pose `deletedAt` | `DELETE` définitif | annule soft delete | `softDelete: true` dans defineOrg |
| **Member** (org) | `removeMember()` | `hardRemoveMember()` | `restoreMember()` | soft par défaut |
| **Group** | pose `deletedAt` | `hardDelete()` | annule soft delete | `softDelete: true` dans defineOrg.groups |
| **GroupMember** | `removeMember()` | `hardRemoveMember()` | `restoreMember()` | soft par défaut |

## Comportement des requêtes

Par défaut, `findById`, `findMany`, `getMembers`, etc. excluent les enregistrements avec `deletedAt IS NOT NULL`.

Pour inclure les supprimés : `{ includeDeleted: true }`.

## Interaction avec permission

- **User** : `delete()` → `permission.suspendAll(userId)`, `restore()` → `permission.restoreAll(userId)`
- **Org** : `delete()` → `permission.org.revokeScope(orgId)`
- **Group** : `delete()` → `permission.group.revokeScope(groupId)`
- **Member** (org/group) : `removeMember()` (soft) → `permission.*.roles.revoke()`, `restoreMember()` → `permission.*.roles.assign()`
