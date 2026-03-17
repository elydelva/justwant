# @justwant/referral

Referral system. defineReferralOffer, createReferralService. auditPlugin.

## Usage

```ts
import { defineReferralOffer, createReferralService } from "@justwant/referral";
import { auditPlugin } from "@justwant/referral/plugins/audit";

const waitlistOffer = defineReferralOffer({
  id: "waitlist_beta",
  name: "Waitlist Beta",
  defaultReferrerType: "user",
  codeGenerator: (offerKey, referrer) => `ref-${referrer.id}`,
});

const listOffer = defineReferralOffer({ id: "waitlist", params: ["listId"] });
listOffer({ listId: "beta" }); // "waitlist:listId:beta"

const service = createReferralService({ repo: myRepo, plugins: [auditPlugin({ audit: { log } })] });

await service.refer(offer, referrer, recipient, metadata);
await service.getReferrer(offer, recipient);
await service.getRecipients(offer, referrer, { limit, offset });
await service.getReferralCode(offer, referrer);
await service.resolveCode(offer, code);
```
