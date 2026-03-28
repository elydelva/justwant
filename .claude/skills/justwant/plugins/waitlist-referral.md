# waitlist referralPlugin (invite)

**Package:** @justwant/waitlist  
**Import:** `@justwant/waitlist/plugins/referral`

> **Ce n'est pas un plugin** au sens classique. C'est une **fonction helper** `invite()` qui combine referral + subscribe. Alternative : passer `referralService` et `offerKeyForList` à `createWaitlistService` — le service exposera alors `service.invite()` qui utilise ces options.

## Cas d'usage

- Parrainage : inviter quelqu'un = referral + inscription avec referredBy
- Tracking : qui a invité qui, pour récompenses

## Dépendances

- `@justwant/referral` — createReferralService (pour ReferralServiceLike)
- `@justwant/actor` — actorKey (déjà dépendance du package waitlist)

## Options (pour invite() en paramètre)

| Option | Type | Description |
|--------|------|-------------|
| referralService | ReferralServiceLike | Service de referral (méthode refer) |
| offerKeyForList | (listKey: string) => string | Map listKey → offer key. Par défaut: listKey |

## ReferralServiceLike

```ts
interface ReferralServiceLike {
  refer(
    offer: string,
    referrer: Actor,
    recipient: Actor,
    metadata?: Record<string, unknown>
  ): Promise<unknown>;
}
```

## Usage

```ts
import { invite } from "@justwant/waitlist/plugins/referral";
import { createReferralService } from "@justwant/referral";

const referralService = createReferralService({ repo: referralRepo });

// Avec referral
await invite(
  list.subscribe.bind(list),
  list,
  inviter,
  invitee,
  { source: "email" },
  referralService,
  (listKey) => `waitlist:${listKey}`
);
```

## Comportement

- Appelle referralService.refer(offerKey, inviter, invitee, metadata) si fourni
- Puis subscribe(list, invitee, { metadata: { ...metadata, referredBy: actorKey(inviter) } })
- offerKey = offerKeyForList(listKey) ?? listKey

## Deux façons d'utiliser

1. **Standalone** : `invite(subscribeFn, list, inviter, invitee, metadata, referralService, offerKeyForList)`
2. **Via service** : `createWaitlistService({ repo, referralService, offerKeyForList })` → `service.invite(list, inviter, invitee, metadata)`
