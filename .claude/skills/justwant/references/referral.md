# @justwant/referral

Referral system. `defineReferralOffer`, `createReferralService`. `auditPlugin`.

## Usage

```ts
import { defineReferralOffer, createReferralService } from "@justwant/referral";
import { auditPlugin } from "@justwant/referral/plugins/audit";

// name: is the identifier (extends Definable<N>)
const waitlistOffer = defineReferralOffer({
  name: "waitlist-beta",
  defaultReferrerType: "user",
  codeGenerator: (offerKey, referrer) => `ref-${referrer.id}`,
});

// Parameterized offer — key() method
const listOffer = defineReferralOffer({ name: "waitlist", params: ["listId"] });
listOffer.key({ listId: "beta" }); // "waitlist:listId:beta"
listOffer("ref_1")                 // { type: "waitlist", id: "ref_1" }

const service = createReferralService({ repo: myRepo, plugins: [auditPlugin({ audit: { log } })] });

await service.refer(waitlistOffer, referrer, recipient, metadata);
await service.getReferrer(waitlistOffer, recipient);
await service.getRecipients(waitlistOffer, referrer, { limit, offset });
await service.getReferralCode(waitlistOffer, referrer);
await service.resolveCode(waitlistOffer, code);
```

`ReferralOfferDef<N>` extends `Definable<N>` + has `.key(params?)` method.

## API

`refer`, `getReferrer`, `getRecipients`, `getReferralCode`, `resolveCode`
