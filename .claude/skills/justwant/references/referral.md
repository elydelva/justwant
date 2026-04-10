# @justwant/referral

Headless referral engine. Track who referred whom, generate and resolve referral codes, query stats. Integrates with `@justwant/waitlist`.

## Install

```bash
bun add @justwant/referral
```

## Core imports

```ts
import { defineReferralOffer, createReferralService, auditPlugin } from "@justwant/referral";
```

## Usage

```ts
// 1. Define an offer
const betaOffer = defineReferralOffer({ name: "beta" });

// Parameterized offer — one key per param set
const waitlistOffer = defineReferralOffer({ name: "waitlist", params: ["listId"] });
waitlistOffer.key({ listId: "prod-launch" }); // "waitlist:listId:prod-launch"

// With custom code generator and defaultReferrerType
const betaOfferCustom = defineReferralOffer({
  name: "beta",
  defaultReferrerType: "user", // enables resolveCode before any referral exists
  codeGenerator: (offerKey, referrer) =>
    crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase(),
});

// 2. Create service
const referral = createReferralService({
  repo: myReferralRepo, // implement ReferralRepository
  plugins: [auditPlugin({ audit: { log } })],
  defaults: { orderBy: "desc" }, // default order for getRecipients
});

// 3. Generate and share a code
const referrer = { type: "user", id: "u-1" };
const code = await referral.getReferralCode(betaOffer, referrer);
// Default: returns referrer.id ("u-1"). Custom: uses codeGenerator.

// 4. Resolve code when new user signs up
const resolvedReferrer = await referral.resolveCode(betaOffer, code);
// Returns Actor | null. Needs defaultReferrerType if no prior referral exists.

if (resolvedReferrer) {
  await referral.refer(betaOffer, resolvedReferrer, { type: "user", id: "u-2" });
  // Throws AlreadyReferredError if u-2 was already referred for this offer
}

// 5. Query stats
const count = await referral.countByReferrer(betaOffer, referrer);       // number
const total = await referral.countByOffer(betaOffer);                     // number (all referrers)
const who = await referral.getReferrer(betaOffer, { type: "user", id: "u-2" }); // Actor | null
const recipients = await referral.getRecipients(betaOffer, referrer, { limit: 20, offset: 0 });
const record = await referral.getReferral(betaOffer, referrer, recipient);  // Referral | null
```

## `defineReferralOffer` options

| Option | Type | Description |
|--------|------|-------------|
| `name` | `string` | Offer name — base offer key |
| `params` | `string[]` (optional) | Parameter names for parameterized offers |
| `codeGenerator` | `(offerKey: string, referrer: Actor) => string \| Promise<string>` (optional) | Custom referral code generator |
| `defaultReferrerType` | `string` (optional) | Actor type to use when resolving a code before any referral exists |

`ReferralOfferDef<N>` extends `Definable<N>` — has `.key(params?)` method and is callable as `betaOffer("ref_1")` → `{ type: "beta", id: "ref_1" }`.

## `createReferralService` options

| Option | Type | Description |
|--------|------|-------------|
| `repo` | `ReferralRepository` | Storage implementation |
| `plugins` | `ReferralPlugin[]` (optional) | Plugins (e.g. `auditPlugin`) |
| `defaults.orderBy` | `"asc" \| "desc"` (optional) | Default order for `getRecipients` |

## `ReferralService` methods

| Method | Description |
|--------|-------------|
| `refer(offer, referrer, recipient, metadata?)` | Record referral — throws `AlreadyReferredError` if duplicate |
| `getReferrer(offer, recipient)` | `Promise<Actor \| null>` |
| `getRecipients(offer, referrer, opts?)` | `Promise<Referral[]>` — opts: `limit` (default 50), `offset`, `orderBy` (default `"desc"`) |
| `getReferral(offer, referrer, recipient)` | `Promise<Referral \| null>` |
| `countByReferrer(offer, referrer)` | `Promise<number>` |
| `countByOffer(offer)` | `Promise<number>` — total across all referrers |
| `getReferralCode(offer, referrer)` | `Promise<string>` — uses `codeGenerator` or referrer `id` |
| `resolveCode(offer, code)` | `Promise<Actor \| null>` — needs `defaultReferrerType` to resolve pre-referral codes |

## Plugins

### `auditPlugin`

```ts
import { auditPlugin } from "@justwant/referral";

const referral = createReferralService({
  repo,
  plugins: [
    auditPlugin({
      audit: {
        async log(entry) {
          await db.insert("referral_audit").values(entry);
        },
      },
    }),
  ],
});
```

### `ReferralAuditEntry` fields

| Field | Type | Description |
|-------|------|-------------|
| `offerKey` | `string` | Offer key for this referral |
| `referrerType` | `string` | Actor type of the referrer |
| `referrerId` | `string` | Actor id of the referrer |
| `recipientType` | `string` | Actor type of the recipient |
| `recipientId` | `string` | Actor id of the recipient |
| `referralId` | `string` | The persisted referral id |
| `referralCode` | `string \| undefined` | Code used, if any |
| `createdAt` | `Date` | When created |

### Custom `ReferralPlugin` interface

```ts
interface ReferralPlugin {
  init?(context: ReferralPluginContext): void;
  beforeRefer?(
    ctx: { offerKey: string; referrer: Actor; recipient: Actor; metadata?: Record<string, unknown> },
    next: () => Promise<Referral>
  ): Promise<Referral>;
  afterRefer?(ctx: { referral: Referral }): Promise<void>;
  onError?(ctx: { offerKey: string; error: unknown }): Promise<void>;
}
```

| Hook | When | Use for |
|------|------|---------|
| `init` | Service creation | Set up shared context |
| `beforeRefer` | Before persisting | Validate, enrich, block |
| `afterRefer` | After persisting | Audit, webhooks, rewards |
| `onError` | On any error | Error reporting |

## `ReferralRepository` interface

```ts
interface ReferralRepository {
  create(data: CreateInput<Referral>): Promise<Referral>;
  findOne(where: Partial<Referral>): Promise<Referral | null>;
  findMany(
    where: Partial<Referral>,
    opts?: { limit?: number; offset?: number; orderBy?: { field: string; direction: "asc" | "desc" } }
  ): Promise<Referral[]>;
  count(where: Partial<Referral>): Promise<number>;
}
```

## Key types

```ts
interface Actor { type: string; id: string; }

interface Referral {
  id: string; offerKey: string;
  referrerType: string; referrerId: string;
  recipientType: string; recipientId: string;
  referralCode?: string; metadata?: Record<string, unknown>;
  createdAt: Date;
}
```

## Errors

| Class | Code | When |
|-------|------|------|
| `ReferralError` | `REFERRAL_ERROR` | Base class — `code`, `metadata` |
| `AlreadyReferredError` | `ALREADY_REFERRED` | `refer` — exposes `offerKey`, `recipientId` |
| `InvalidReferralCodeError` | `INVALID_REFERRAL_CODE` | Reserved for custom use (`resolveCode` returns `null` instead of throwing) |
