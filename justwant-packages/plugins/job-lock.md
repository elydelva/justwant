# job lockPlugin

**Package:** @justwant/job  
**Import:** `@justwant/job/plugins/lock`

Empêche l'exécution double d'un même job sur plusieurs instances via un lock distribué (@justwant/lock).

## Cas d'usage

- Plusieurs workers BullMQ/Node : éviter qu'un même job tourne 2x
- Cron distribué : une seule instance exécute à chaque tick

## Dépendances

- `@justwant/lock` — createLock, adapter Redis ou autre

## Options

| Option | Type | Default | Requis | Description |
|--------|------|---------|--------|-------------|
| lock | LockApi | — | **oui** | Instance @justwant/lock |
| owner | LockOwner | { type: "job", id: "default" } | non | Propriétaire du lock |
| ttlMs | number | 60_000 | non | TTL du lock en ms |

## Usage

```ts
import { createJobRuntime } from "@justwant/job";
import { lockPlugin } from "@justwant/job/plugins/lock";
import { createLock } from "@justwant/lock";

const lock = createLock({ adapter: redisAdapter });

const runtime = createJobRuntime({
  engine: bullmqEngine(...),
  plugins: [
    lockPlugin({
      lock,
      ttlMs: 120_000,
    }),
  ],
});
```

## Comportement

- beforeExecute: acquire lock `job:{jobId}` avant d'exécuter
- Si lock non acquis → skip (return sans exécuter)
- Après next(): release le lock (finally)
- Les erreurs de release sont ignorées (lock expiré, etc.)

## Pièges

- **Skip silencieux** : si le lock n'est pas acquis, le job n'est pas exécuté et aucune erreur n'est levée (pas de retry automatique)
