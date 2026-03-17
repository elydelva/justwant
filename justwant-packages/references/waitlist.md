# @justwant/waitlist

Waitlist. defineList, createWaitlistService. subscribe, pop, invite, referral.

## Usage

```ts
import { defineList, createWaitlistService, createMemoryWaitlistAdapter } from "@justwant/waitlist";

const betaList = defineList({ id: "beta" })();
const launchList = defineList({ id: "launch", params: ["productId"] });
const list = launchList("prod-1"); // listKey: "launch:prod-1"

const service = createWaitlistService({ repo: createMemoryWaitlistAdapter() });

await service.subscribe(betaList, { type: "user", id: "u1" });
await service.isSubscribed(betaList, { type: "user", id: "u1" });
await service.count(betaList);
await service.getPosition(betaList, actor);
const first = await service.pop(betaList);
await service.invite(betaList, inviter, invitee, { campaign: "beta" });
```

## With referral

createWaitlistService({ repo, referralService, offerKeyForList: (listKey) => `waitlist:${listKey}` })

## Plugins

auditPlugin, expirationPlugin (cleanupExpired)
