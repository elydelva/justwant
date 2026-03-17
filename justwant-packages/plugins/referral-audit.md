# referral auditPlugin

**Package:** @justwant/referral  
**Import:** `@justwant/referral/plugins/audit`

Log chaque referral créé pour traçabilité.

## Cas d'usage

- Conformité / audit trail
- Analytics (taux de parrainage, top referrers)
- Debug (qui a parrainé qui)

## Types exportés

- `ReferralAuditEntry` — offerKey, referrerType, referrerId, recipientType, recipientId, referralId, referralCode?, createdAt

## Options

| Option | Type | Requis | Description |
|--------|------|--------|-------------|
| audit | { log(entry: ReferralAuditEntry): void \| Promise<void> } | **oui** | Callback de log |

## ReferralAuditEntry

| Champ | Type |
|-------|------|
| offerKey | string |
| referrerType | string |
| referrerId | string |
| recipientType | string |
| recipientId | string |
| referralId | string |
| referralCode | string (optionnel) |
| createdAt | Date |

## Usage

```ts
import { createReferralService } from "@justwant/referral";
import { auditPlugin } from "@justwant/referral/plugins/audit";

const service = createReferralService({
  repo: myRepo,
  plugins: [
    auditPlugin({
      audit: {
        async log(entry) {
          await db.insert(referralAuditTable).values(entry);
        },
      },
    }),
  ],
});
```

## Comportement

- afterRefer: appelé après création du referral, avec ctx.referral
- Log toutes les infos du referral (offer, referrer, recipient, id, code, date)

## Notes

- Aucune dépendance externe
