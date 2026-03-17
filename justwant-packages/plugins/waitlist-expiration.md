# waitlist expirationPlugin (cleanupExpired)

**Package:** @justwant/waitlist  
**Import:** `@justwant/waitlist/plugins/expiration`

> **Ce n'est pas un plugin** au sens classique (pas d'objet avec hooks). C'est une **fonction utilitaire** `cleanupExpired(repo, listKey)` à appeler périodiquement (cron) ou à la demande.

## Cas d'usage

- Entrées avec `expiresAt` : nettoyage périodique
- Cron quotidien : `cleanupExpired(repo, "beta-list")`

## Usage

```ts
import { cleanupExpired } from "@justwant/waitlist/plugins/expiration";

// Périodiquement (ex: cron)
const removed = await cleanupExpired(repo, "beta-list");
console.log(`Removed ${removed} expired entries`);
```

## Comportement

- findMany({ listKey }) pour récupérer toutes les entrées
- Pour chaque entrée avec expiresAt < now: unsubscribe(listKey, actorKey)
- Retourne le nombre d'entrées supprimées
- Utilise actorKey(fromRepo(entry)) pour identifier l'entrée

## Dépendances

- `@justwant/actor` — actorKey, fromRepo (déjà dépendance du package waitlist)
