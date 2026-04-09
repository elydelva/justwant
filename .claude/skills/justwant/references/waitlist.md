# @justwant/waitlist

Waitlist. `defineList`, `createWaitlistService`. subscribe, pop, invite, referral.

## Usage

```ts
import { defineList, createWaitlistService, createMemoryWaitlistAdapter } from "@justwant/waitlist";

// name: is the identifier (extends Definable<N>)
const betaList = defineList({ name: "beta" });
betaList("u1")          // { type: "beta", id: "u1" } — Definable usage

// Parameterized list — key() for the list key
const launchList = defineList({ name: "launch", params: ["productId"] });
launchList.key("prod-1") // "launch:prod-1" — list key for service calls
launchList("u1")         // { type: "launch", id: "u1" }

const service = createWaitlistService({ repo: createMemoryWaitlistAdapter() });

// Service methods accept WaitlistDef | string
await service.subscribe(betaList, { type: "user", id: "u1" });
await service.isSubscribed(betaList, { type: "user", id: "u1" });
await service.count(betaList);
await service.getPosition(betaList, actor);
const first = await service.pop(betaList);
await service.invite(betaList, inviter, invitee, { campaign: "beta" });
```

`WaitlistDef<N>` extends `Definable<N>` + has `.key(...params)` method.

## With referral

```ts
createWaitlistService({
  repo,
  referralService,
  offerKeyForList: (listKey) => `waitlist:${listKey}`,
})
```

## Plugins

`auditPlugin`, `expirationPlugin` (`cleanupExpired`)
