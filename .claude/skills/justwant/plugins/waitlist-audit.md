# waitlist auditPlugin

**Package:** @justwant/waitlist  
**Import:** `@justwant/waitlist/plugins/audit`

Log subscribe, unsubscribe, pop pour traçabilité.

## Cas d'usage

- Conformité / audit trail
- Analytics (conversion, churn)
- Debug (qui s'est inscrit, quand)

## Types exportés

- `AuditEntry` — operation, listKey, actorKey?, entryId?, timestamp

## Options

| Option | Type | Requis | Description |
|--------|------|--------|-------------|
| audit | { log(entry: AuditEntry): void \| Promise<void> } | **oui** | Callback de log |

## AuditEntry

| Champ | Type |
|-------|------|
| operation | string (subscribe, unsubscribe, pop) |
| listKey | string |
| actorKey | string (via @justwant/actor) |
| entryId | string (après opération) |
| timestamp | Date |

## Usage

```ts
import { createWaitlistService } from "@justwant/waitlist";
import { auditPlugin } from "@justwant/waitlist/plugins/audit";

const service = createWaitlistService({
  repo: myRepo,
  plugins: [
    auditPlugin({
      audit: {
        async log(entry) {
          await db.insert(waitlistAuditTable).values(entry);
        },
      },
    }),
  ],
});
```

## Comportement

- beforeExecute: log avant next avec operation, listKey, actorKey, timestamp
- Après next: si ctx.entry existe, ajoute entryId à l'entrée
- Utilise actorKey() de @justwant/actor pour identifier l'acteur

## Dépendances

- `@justwant/actor` — actorKey (déjà dépendance du package waitlist)
