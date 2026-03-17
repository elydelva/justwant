# @justwant/referral

Referral and affiliation system. Parrainage, codes parrain, stats. Standalone package with `defineReferralOffer` + `createReferralService`.

## Terminology

| Term | Description |
|------|--------------|
| **ReferralOffer** | What can be referred (e.g. waitlist signup, first purchase) |
| **Referrer** | The actor who refers (sends the invitation) |
| **ReferralRecipient** | The referred actor (joins via the link) |
| **Referral** | The entity recording referrer → recipient for an offer |
| **ReferralCode** | Unique code/link for the referrer (optional) |

## Usage

### Define an offer

```ts
import { defineReferralOffer } from "@justwant/referral";

const waitlistOffer = defineReferralOffer({
  id: "waitlist_beta",
  name: "Waitlist Beta",
  defaultReferrerType: "user", // for resolveCode before any referral exists
  codeGenerator: (offerKey, referrer) => `ref-${referrer.id}`, // optional
});

// Parametrized offer
const listOffer = defineReferralOffer({
  id: "waitlist",
  params: ["listId"],
});
listOffer({ listId: "beta" }); // → "waitlist:listId:beta"
```

### Create the service

```ts
import { createReferralService } from "@justwant/referral";

const service = createReferralService({
  repo: myReferralRepository,
  plugins: [auditPlugin({ audit: myAudit })],
});
```

### API

- `refer(offer, referrer, recipient, metadata?)` — Register a referral
- `getReferrer(offer, recipient)` — Get referrer of a recipient
- `getRecipients(offer, referrer, opts?)` — List recipients of a referrer
- `getReferral(offer, referrer, recipient)` — Get referral if exists
- `countByReferrer(offer, referrer)` — Count referrals by referrer
- `countByOffer(offer)` — Total referrals for offer
- `getReferralCode(offer, referrer)` — Generate or retrieve referral code
- `resolveCode(offer, code)` — Resolve code → referrer

## Integration with waitlist

Use `createWaitlistReferralPlugin(referralService)` from `@justwant/waitlist/plugins/referral` to wire referral into waitlist subscriptions.
