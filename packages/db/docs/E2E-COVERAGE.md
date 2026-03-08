# E2E Coverage et améliorations

## État actuel

| Couche | SQLite | PGLite | PostgreSQL | MySQL |
|--------|--------|--------|------------|-------|
| **Drizzle** | ✅ | — | ✅ | ✅ |
| **Waddler** | ✅ (bun-sqlite) | ✅ | ✅ | ✅ |
| **Prisma** | ✅ | — | ✅ | ✅ |

- **better-sqlite3** : skip sous Bun (bindings natifs non supportés)
- **Tests unitaires** : mock ou in-memory uniquement

## Pistes d'amélioration

### 1. Matrice de compatibilité partagée

Créer un helper `runE2EMatrix(dialects, scenarios)` qui exécute les mêmes scénarios (CRUD, transaction, softDelete, unique violation) sur chaque dialecte disponible. Réduit la duplication entre Drizzle, Waddler et Prisma.

### 2. Tests de régression par dialecte

Pour chaque adapter, ajouter des tests ciblant les différences dialectales :

- **PostgreSQL** : `RETURNING`, `jsonb`, `uuid`
- **MySQL** : pas de `RETURNING` (fallback insert+select), backticks pour identifiants
- **SQLite** : `TEXT` vs `VARCHAR`, contraintes

### 3. better-sqlite3 sous Node

Exécuter les tests better-sqlite3 via `node` au lieu de `bun` dans CI :

```bash
node --test packages/db/src/waddler/integration.spec.ts
```

Ou un script dédié : `test:better-sqlite3` qui lance uniquement ces tests avec Node.

### 4. Tests de performance / charge

Pour valider le comportement sous charge :

- Insertions en batch
- Concurrence (plusieurs clients en parallèle)
- Transactions longues

### 5. CI avec Docker

Dans GitHub Actions ou équivalent :

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env: ...
  mysql:
    image: mysql:8
    env: ...
```

Puis exécuter `bun run test:e2e:full` pour une couverture E2E complète à chaque push.
