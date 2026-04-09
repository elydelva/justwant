# @justwant/waitlist

Headless FIFO waitlist engine. Subscribe actors, track positions, pop entries, invite, bulk ops, expiration, and optional referral integration.

## Install

```bash
bun add @justwant/waitlist
# + @justwant/referral for invite tracking
```

## Core imports

```ts
import {
  defineList,
  createWaitlistService,
  createMemoryWaitlistAdapter,
  auditPlugin,
  cleanupExpired,
} from "@justwant/waitlist";
```

## Usage

```ts
// 1. Define a list
const betaList = defineList({ name: "beta" });

// Parameterized list — one key per parameter set
const productList = defineList({ name: "product", params: ["productId"] });
const key = productList.key("prod-123"); // "product:prod-123"

// 2. Create service
const waitlist = createWaitlistService({
  repo: createMemoryWaitlistAdapter(), // or createWaitlistDbAdapter from @justwant/db
});

const actor = { type: "user", id: "u-1" };

// Subscribe
await waitlist.subscribe(betaList, actor);
await waitlist.subscribe(betaList, actor, {
  metadata: { source: "landing-page" },
  priority: 10,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
});

// Query
await waitlist.isSubscribed(betaList, actor);             // boolean
await waitlist.count(betaList);                           // number
const { position, total } = await waitlist.getPosition(betaList, actor);
const entries = await waitlist.listSubscribers(betaList, { limit: 20, offset: 0, orderBy: "asc" });

// Pop (removes and returns first entry, null if empty)
const next = await waitlist.pop(betaList);

// Invite
await waitlist.invite(betaList, inviter, invitee, { campaign: "beta" });
// invitee entry has metadata.referredBy = "user:u-1"

// Bulk ops (silently skips already-subscribed / not-subscribed)
await waitlist.subscribeMany(betaList, [{ type: "user", id: "u-2" }, { type: "user", id: "u-3" }]);
await waitlist.unsubscribeMany(betaList, [{ type: "user", id: "u-2" }]);

// Unsubscribe
await waitlist.unsubscribe(betaList, actor);
```

## `defineList` options

| Option | Type | Description |
|--------|------|-------------|
| `name` | `string` | Unique list name |
| `params` | `string[]` (optional) | Parameter names for parameterized list keys |
| `schema` | `WaitlistMetadataSchema<TMetadata>` (optional) | Standard Schema validator for metadata |
| `defaults` | `Record<string, unknown>` (optional) | Default metadata values |

`WaitlistDef<N>` extends `Definable<N>` — has `.key(...paramValues)` method and is callable as `betaList("actorId")` → `{ type: "beta", id: "actorId" }`.

## `createWaitlistService` options

| Option | Type | Description |
|--------|------|-------------|
| `repo` | `WaitlistRepository` | Storage implementation |
| `plugins` | `WaitlistPlugin[]` (optional) | Plugins (e.g. `auditPlugin`) |
| `referralService` | `ReferralServiceLike` (optional) | Enables referral tracking in `invite` |
| `offerKeyForList` | `(listKey: string) => string` (optional) | Maps list key → referral offer key |
| `defaults` | `Record<string, unknown>` (optional) | Default metadata |

## `WaitlistService` methods

| Method | Description |
|--------|-------------|
| `subscribe(list, actor, opts?)` | Subscribe actor — throws `AlreadySubscribedError` |
| `unsubscribe(list, actor)` | Unsubscribe — throws `NotSubscribedError` |
| `isSubscribed(list, actor)` | `Promise<boolean>` |
| `count(list)` | `Promise<number>` |
| `listSubscribers(list, opts?)` | `Promise<WaitlistEntry[]>` — opts: `limit`, `offset`, `orderBy: "asc" \| "desc"` |
| `getPosition(list, actor)` | `Promise<{ position: number; total: number }>` — throws `NotSubscribedError` |
| `pop(list)` | Remove and return first FIFO entry, `null` if empty |
| `invite(list, inviter, invitee, metadata?)` | Subscribe invitee with `referredBy` metadata; records referral if `referralService` configured |
| `subscribeMany(list, actors, opts?)` | Bulk subscribe, skips already-subscribed |
| `unsubscribeMany(list, actors)` | Bulk unsubscribe, skips not-subscribed |

Positions are computed on the fly from `createdAt` ascending (1-based). `priority` field is available for custom adapter ordering.

## Referral integration

```ts
import { createReferralService } from "@justwant/referral";

const waitlist = createWaitlistService({
  repo,
  referralService: createReferralService({ repo: referralRepo }),
  offerKeyForList: (listKey) => `waitlist:${listKey}`,
});
// waitlist.invite(...) now also calls referral.refer(...)
```

## Plugins

### `auditPlugin`

```ts
import { auditPlugin } from "@justwant/waitlist";

const waitlist = createWaitlistService({
  repo,
  plugins: [
    auditPlugin({
      audit: {
        log(entry) {
          console.log(`[audit] ${entry.operation} ${entry.listKey} ${entry.actorKey ?? ""}`);
        },
      },
    }),
  ],
});
```

### `AuditEntry` fields

| Field | Type | Description |
|-------|------|-------------|
| `operation` | `string` | e.g. `"subscribe"`, `"unsubscribe"`, `"pop"` |
| `listKey` | `string` | The list key |
| `actorKey` | `string \| undefined` | Actor identifier |
| `entryId` | `string \| undefined` | Entry id |
| `timestamp` | `Date` | When logged |

### `cleanupExpired` (utility, not a plugin)

```ts
import { cleanupExpired } from "@justwant/waitlist";

const removed = await cleanupExpired(repo, "beta");
// Removes all entries with expiresAt < now, returns count removed
```

### Custom `WaitlistPlugin` interface

```ts
interface WaitlistPlugin {
  init?(context: { setContext?(key: string, value: unknown): void }): void;
  beforeExecute?(ctx: WaitlistPluginContext, next: () => Promise<unknown>): Promise<unknown>;
  afterExecute?(ctx: WaitlistPluginContext, next: () => Promise<unknown>): Promise<unknown>;
  onError?(ctx: { operation: string; error: unknown }): Promise<void>;
}
```

## `WaitlistRepository` interface

```ts
interface WaitlistRepository {
  subscribe(entry: Omit<WaitlistEntry, "id" | "createdAt">): Promise<WaitlistEntry>;
  unsubscribe(listKey: string, actorKey: string): Promise<void>;
  findOne(where: Partial<WaitlistEntry>): Promise<WaitlistEntry | null>;
  findMany(where: Partial<WaitlistEntry>, opts?: FindManyOptions): Promise<WaitlistEntry[]>;
  count(where: Partial<WaitlistEntry>): Promise<number>;
  delete(id: string): Promise<void>;
}
```

## Key types

```ts
interface Actor { type: string; id: string; orgId?: string; }

interface WaitlistEntry {
  id: string; listKey: string;
  actorType: string; actorId: string; actorOrgId?: string;
  position?: number; priority?: number;
  metadata?: Record<string, unknown>; referredBy?: string;
  createdAt: Date; expiresAt?: Date;
}
```

## Errors

| Class | Code | When |
|-------|------|------|
| `WaitlistError` | `WAITLIST_ERROR` | Base class — `code`, `metadata` |
| `AlreadySubscribedError` | `ALREADY_SUBSCRIBED` | `subscribe` — exposes `listKey`, `actorKey` |
| `NotSubscribedError` | `NOT_SUBSCRIBED` | `unsubscribe` / `getPosition` — exposes `listKey`, `actorKey` |
| `EmptyWaitlistError` | `EMPTY_WAITLIST` | Reserved for custom adapters (`pop` returns `null` instead) |
