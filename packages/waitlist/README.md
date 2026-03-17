# @justwant/waitlist

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Waitlist management: subscription, position, FIFO, invitations, referral.

## Installation

```bash
bun add @justwant/waitlist
# or
npm install @justwant/waitlist
# or
pnpm add @justwant/waitlist
```

## Usage

### Define a list

```ts
import { defineList, createWaitlistService, createMemoryWaitlistAdapter } from "@justwant/waitlist";

// Simple list
const betaList = defineList({ id: "beta" })();

// Parameterized list (e.g. per product)
const launchList = defineList({ id: "launch", params: ["productId"] });
const list = launchList("prod-1"); // listKey: "launch:prod-1"
```

### Create service

```ts
const repo = createMemoryWaitlistAdapter(); // or createWaitlistDbAdapter with @justwant/db
const service = createWaitlistService({ repo });

// Subscribe
await service.subscribe(betaList, { type: "user", id: "u1" });
await service.subscribe(betaList, { type: "user", id: "u1" }, { metadata: { source: "landing" } });

// Check & count
await service.isSubscribed(betaList, { type: "user", id: "u1" }); // true
await service.count(betaList); // 1

// Position
await service.getPosition(betaList, { type: "user", id: "u1" }); // { position: 1, total: 1 }

// FIFO pop
const first = await service.pop(betaList);

// Invite (with referral metadata)
await service.invite(betaList, { type: "user", id: "inviter" }, { type: "user", id: "invitee" });

// Bulk
await service.subscribeMany(betaList, [actor1, actor2]);
await service.unsubscribeMany(betaList, [actor1]);
```

### With referral service

```ts
import { createReferralService } from "@justwant/referral";

const referralService = createReferralService({ repo: referralRepo });
const service = createWaitlistService({
  repo: waitlistRepo,
  referralService,
  offerKeyForList: (listKey) => `waitlist:${listKey}`,
});

await service.invite(list, inviter, invitee, { campaign: "beta" });
```

### Plugins

#### auditPlugin

Logs subscribe/unsubscribe/pop for audit trail.

```ts
import { auditPlugin } from "@justwant/waitlist/plugins/audit";

const service = createWaitlistService({
  repo: waitlistRepo,
  plugins: [
    auditPlugin({
      audit: {
        log: (entry) => console.log(entry),
        // entry: { action, listKey, actor, ... }
      },
    }),
  ],
});
```

#### referralPlugin (integration)

Wire referral into waitlist via `referralService` option. When provided, `invite()` registers the referral and subscribes the invitee.

```ts
import { createWaitlistService } from "@justwant/waitlist";
import { createReferralService } from "@justwant/referral";

const referralService = createReferralService({ repo: referralRepo });
const service = createWaitlistService({
  repo: waitlistRepo,
  referralService,
  offerKeyForList: (listKey) => `waitlist:${listKey}`,  // optional
});

await service.invite(list, inviter, invitee, { campaign: "beta" });
```

#### expirationPlugin (cleanupExpired)

Remove expired entries. Call via cron:

```ts
import { cleanupExpired } from "@justwant/waitlist/plugins/expiration";

await cleanupExpired(service, list);
```

## API

| Method | Description |
|--------|-------------|
| `defineList(config)` | Define a portable list |
| `createWaitlistService(options)` | Create service with repo |
| `createWaitlistDbAdapter(options)` | DB adapter from table |
| `createMemoryWaitlistAdapter()` | In-memory adapter (testing) |
| `subscribe(list, actor, opts?)` | Add to waitlist |
| `unsubscribe(list, actor)` | Remove from waitlist |
| `isSubscribed(list, actor)` | Check membership |
| `count(list)` | Total subscribers |
| `listSubscribers(list, opts?)` | List with pagination |
| `getPosition(list, actor)` | Position in queue |
| `pop(list)` | Remove and return first (FIFO) |
| `invite(list, inviter, invitee, metadata?)` | Subscribe with referral |
| `subscribeMany` / `unsubscribeMany` | Bulk operations |

## Subpaths

| Path | Description |
|------|-------------|
| `@justwant/waitlist` | Main API |
| `@justwant/waitlist/adapters/db` | DB adapter |
| `@justwant/waitlist/adapters/memory` | Memory adapter |
| `@justwant/waitlist/plugins/audit` | Audit plugin |
| `@justwant/waitlist/plugins/expiration` | Expiration cleanup |
| `@justwant/waitlist/plugins/referral` | Referral integration |

## License

MIT
