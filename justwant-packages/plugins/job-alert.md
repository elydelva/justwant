# job alertPlugin

**Package:** @justwant/job  
**Import:** `@justwant/job/plugins/alert`

Notifie en cas d'échec de job.

## Cas d'usage

- Slack / Discord / PagerDuty sur échec
- Alerting proactif avant que l'utilisateur ne signale un bug

## Types exportés

- `AlertPayload` — jobId, error, runCount?

## Options

| Option | Type | Requis | Description |
|--------|------|--------|-------------|
| notify | (payload: AlertPayload) => void \| Promise<void> | **oui** | Callback de notification |

## AlertPayload

| Champ | Type |
|-------|------|
| jobId | string |
| error | unknown |
| runCount | number (optionnel) |

## Usage

```ts
import { createJobRuntime } from "@justwant/job";
import { alertPlugin } from "@justwant/job/plugins/alert";

const runtime = createJobRuntime({
  engine: bullmqEngine(...),
  plugins: [
    alertPlugin({
      notify: async ({ jobId, error }) => {
        await sendSlackAlert(`Job ${jobId} failed: ${error}`);
      },
    }),
  ],
});
```

## Comportement

- onError: appelé quand le job échoue, avec jobId et error
- Ne modifie pas le flux d'erreur (le job reste en échec)

## Notes

- Aucune dépendance externe
