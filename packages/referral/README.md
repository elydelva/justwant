# @justwant/referral

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Referral and affiliation system. Referral codes, stats, integration with waitlist.

## Installation

```bash
bun add @justwant/referral
# or
npm install @justwant/referral
# or
pnpm add @justwant/referral
```

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
import { auditPlugin } from "@justwant/referral/plugins/audit";

const service = createReferralService({
  repo: myReferralRepository,
  plugins: [
    auditPlugin({
      audit: {
        log: (entry) => console.log(entry),
        // entry: { offerKey, referrerType, referrerId, recipientType, recipientId, referralId, referralCode?, createdAt }
      },
    }),
  ],
});
```

### auditPlugin

Logs each referral for audit trail.

```ts
import { auditPlugin } from "@justwant/referral/plugins/audit";

createReferralService({
  repo: referralRepo,
  plugins: [
    auditPlugin({
      audit: { log: (entry) => myAudit.log(entry) },
    }),
  ],
});
```

## API

| Method | Description |
|--------|-------------|
| `refer(offer, referrer, recipient, metadata?)` | Register a referral |
| `getReferrer(offer, recipient)` | Get referrer of a recipient |
| `getRecipients(offer, referrer, opts?)` | List recipients of a referrer |
| `getReferral(offer, referrer, recipient)` | Get referral if exists |
| `countByReferrer(offer, referrer)` | Count referrals by referrer |
| `countByOffer(offer)` | Total referrals for offer |
| `getReferralCode(offer, referrer)` | Generate or retrieve referral code |
| `resolveCode(offer, code)` | Resolve code → referrer |

## Subpaths

| Path | Description |
|------|-------------|
| `@justwant/referral` | defineReferralOffer, createReferralService |
| `@justwant/referral/plugins/audit` | auditPlugin |

## Integration with waitlist

Use `createWaitlistReferralPlugin(referralService)` from `@justwant/waitlist/plugins/referral` to wire referral into waitlist subscriptions.

## License

MIT
