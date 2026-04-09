# @justwant/flag

Feature flags with typed rules, config overrides, percentage rollout, and time-based diffusion. Integrates with `@justwant/bezier` for smooth rollout curves.

## Install

```bash
bun add @justwant/flag
```

## Core imports

```ts
import { createFlagService, createMemoryFlagConfigRepo, defineFlag, defineRule } from "@justwant/flag";
import { diffusionBezier, diffusionStepped, hashContext, rollout } from "@justwant/flag/helpers";
import { defineFeature } from "@justwant/feature";
```

## Usage

```ts
import * as v from "valibot";

// 1. Define rules
const betaRule = defineRule({
  name: "beta-rollout",
  config: v.object({ startIso: v.string(), endIso: v.string() }),
  context: v.object({ userId: v.string(), orgId: v.optional(v.string()) }),
  defaultConfig: { startIso: "2025-01-01", endIso: "2025-03-01" },
  logic: ({ config, context }) => {
    const pct = diffusionBezier({
      curve: easeIn, // BezierCurve from @justwant/bezier
      start: new Date(config.startIso),
      end: new Date(config.endIso),
    });
    return rollout(hashContext(context.userId), pct);
  },
});

// 2. Define a flag — takes a FeatureDef + config
const feature = defineFeature({ name: "new-dashboard" });
const newDashboard = defineFlag(feature, {
  default: false,
  rules: [betaRule],
  strategy: "any", // "any" | "all"
});
// newDashboard.name === "new-dashboard"

// 3. Create service
const flagService = createFlagService({
  flags: [newDashboard],
  repo: createMemoryFlagConfigRepo(),
});

// 4. Evaluate
const enabled = await flagService.evaluate(newDashboard, { userId: "u1" });

// Ad-hoc override (not persisted)
const test = await flagService.evaluate(newDashboard, { userId: "u1" }, {
  "beta-rollout": { startIso: "2020-01-01", endIso: "2020-01-02" },
});

// 5. Remote config management
await flagService.setConfigOverride(betaRule, { startIso: "2025-02-01", endIso: "2025-04-01" });
await flagService.setConfigOverride("beta-rollout", { ... }); // string ref also accepted
const latest = await flagService.getLatest(betaRule);
const history = await flagService.listConfigHistory(betaRule, { limit: 10 });
await flagService.rollbackLastConfig(betaRule);
```

## `defineRule` options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `name` | `string` | Yes | Unique rule identifier — key in config repo and override maps |
| `config` | `StandardSchemaV1` | No | Remote config schema (sync only — async validators not supported) |
| `context` | `StandardSchemaV1` | No | Request context schema (validated at evaluate time) |
| `defaultConfig` | `CConfig` | No | Fallback config when no remote override exists |
| `logic` | `({ config, context }) => boolean \| Promise<boolean>` | Yes | Return `true` to enable the flag |

## `defineFlag` options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `default` | `boolean` | `undefined` | Fallback when all rules fail to produce a result |
| `rules` | `RuleDef[]` | — | Rules to evaluate (at least one required) |
| `strategy` | `"any" \| "all"` | `"any"` | `"any"` = OR, `"all"` = AND |

## `createFlagService` options

| Option | Type | Description |
|--------|------|-------------|
| `flags` | `FlagDef[]` | All flag definitions managed by this service |
| `repo` | `FlagConfigRepo` | Config override repository |

## `FlagService` methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `evaluate` | `(flag, context, override?) => Promise<boolean>` | Evaluate a flag — merges defaultConfig + remote override + ad-hoc override |
| `setConfigOverride` | `(rule, config) => Promise<ConfigOverride>` | Persist a new config override (validates against rule schema) |
| `getLatest` | `(rule: RuleRef) => Promise<ConfigOverride \| null>` | Get latest active (non-rolled-back) override |
| `listConfigHistory` | `(rule, opts?) => Promise<ConfigOverride[]>` | List all overrides (newest first, includes rolled-back) |
| `rollbackLastConfig` | `(rule) => Promise<void>` | Mark latest active override as rolled back |

Config resolution order per rule: ad-hoc override > remote override > `defaultConfig`.

## `ConfigOverride` shape

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier |
| `ruleId` | `string` | Matches `rule.name` |
| `config` | `Record<string, unknown>` | Stored config object |
| `rolledBack` | `boolean` | Soft-delete flag |
| `createdAt` | `Date` | Creation timestamp |

## `FlagConfigRepo` interface

```ts
interface FlagConfigRepo {
  create(data: CreateInput<ConfigOverride>): Promise<ConfigOverride>;
  findOne(where: Partial<ConfigOverride>): Promise<ConfigOverride | null>;
  findMany(where: Partial<ConfigOverride>, opts?: FindManyOptions): Promise<ConfigOverride[]>;
  count(where: Partial<ConfigOverride>): Promise<number>;
  update(id: string, data: { rolledBack: boolean }): Promise<ConfigOverride>;
}
```

## Helpers (`@justwant/flag/helpers`)

| Helper | Signature | Description |
|--------|-----------|-------------|
| `hashContext` | `(context: string \| Record<string, unknown>) => number` | SHA-256 hash to `[0, 1]` — object keys sorted for stability |
| `rollout` | `(input: number, threshold: number) => boolean` | `input < threshold` → enabled |
| `diffusionBezier` | `({ curve, start, end, at? }) => number` | Time-based % via Bézier curve |
| `diffusionStepped` | `({ steps, start, end, at? }) => number` | Time-based % via discrete steps |

### `diffusionBezier` options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `curve` | `BezierCurve` | Yes | Curve shape from `@justwant/bezier` |
| `start` | `Date` | Yes | Rollout start (percentage = 0) |
| `end` | `Date` | Yes | Rollout end (percentage = 1) |
| `at` | `Date` | No | Evaluation point in time (default: `new Date()`) |

### `diffusionStepped` options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `steps` | `number[]` | Yes | Percentage at each step boundary, e.g. `[0, 0.1, 0.3, 1]` |
| `start` | `Date` | Yes | Rollout start |
| `end` | `Date` | Yes | Rollout end |
| `at` | `Date` | No | Evaluation point in time (default: `new Date()`) |

## Errors

| Class | Code | When |
|-------|------|------|
| `FlagError` | `FLAG_ERROR` | Base class — `code`, `metadata` |
| `FlagValidationError` | `FLAG_VALIDATION_ERROR` | Config or context schema validation fails — `metadata.ruleId`, `metadata.issues` |
| `RuleNotFoundError` | `RULE_NOT_FOUND` | String rule ref not registered in service — exposes `ruleId` |

## Types

- `RuleDef<N, CConfig, CContext>` — extends `Inspectable<N>`
- `FlagDef<N>` — has `.name: N`, `.feature: FeatureDef<N>`
- `RuleRef` — `RuleDef | string` — accepted by all service methods
