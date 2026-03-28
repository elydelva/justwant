# job auditPlugin

**Package:** @justwant/job  
**Import:** `@justwant/job/plugins/audit`

Log chaque exécution de job pour traçabilité (audit trail).

## Cas d'usage

- Conformité / audit trail
- Debug (durée, statut, payloadHash)
- Métriques (taux d'échec, latence)

## Types exportés

- `AuditEntry` — jobId, startedAt, durationMs, status, payloadHash

## Options

| Option | Type | Requis | Description |
|--------|------|--------|-------------|
| audit | { log(entry: AuditEntry): void \| Promise<void> } | **oui** | Callback de log |

## AuditEntry

| Champ | Type |
|-------|------|
| jobId | string |
| startedAt | Date |
| durationMs | number |
| status | "success" \| "failure" |
| payloadHash | string (hash simple du payload) |

## Usage

```ts
import { createJobRuntime } from "@justwant/job";
import { auditPlugin } from "@justwant/job/plugins/audit";

const runtime = createJobRuntime({
  engine: bullmqEngine(...),
  plugins: [
    auditPlugin({
      audit: {
        async log(entry) {
          await db.insert(auditTable).values(entry);
        },
      },
    }),
  ],
});
```

## Comportement

- beforeExecute: enregistre startedAt, exécute next, en finally log avec durationMs et status
- payloadHash: hash simple (djb2-like) du payload pour éviter de stocker des données sensibles
- En cas d'erreur: status = "failure", puis rethrow

## Notes

- Aucune dépendance externe
