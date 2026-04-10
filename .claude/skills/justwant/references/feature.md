# @justwant/feature

Zero-dependency primitive that defines the canonical feature identity type used across the @justwant ecosystem.

## Usage

```ts
import { defineFeature } from "@justwant/feature";

// lib/features.ts — define once, share across packages
export const billing = defineFeature({ name: "billing" });
export const analytics = defineFeature({ name: "analytics" });

billing.name;           // "billing"
billing("plan_pro");    // { type: "billing", id: "plan_pro" }

// Pass to @justwant/flag
import { defineFlag } from "@justwant/flag";
const billingFlag = defineFlag(billing, { default: false, rules: [] });
```

## defineFeature options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `name` | `string` | Yes | Unique feature name — becomes the `type` field of any constructed `Feature` reference |

## API

| Export | Type | Description |
|--------|------|-------------|
| `defineFeature(options)` | `(options) => FeatureDef<N>` | Create a typed feature definition |
| `FeatureDef<N>` | callable object | `name: N` + callable as `(id: string) => Feature<N>` |
| `Feature<T>` | `{ type: T; id: string }` | Canonical feature reference — extends `RefLike<T>` from `@justwant/meta` |
