# @justwant/flag

Feature flags with typed rules, config overrides, rollout. Uses `@justwant/bezier` for diffusion curves.

## Usage

```ts
import { createFlagService, createMemoryFlagConfigRepo, defineFlag, defineRule } from "@justwant/flag";
import { diffusionBezier, hashContext, rollout } from "@justwant/flag/helpers";
import { defineFeature } from "@justwant/feature";
import { gradual } from "@justwant/bezier/feature";

// defineRule — name: is the identifier (extends Inspectable<N>)
const betaRule = defineRule({
  name: "beta-rollout",
  config: v.object({
    start: v.optional(v.pipe(v.string(), v.transform((s) => new Date(s)))),
    end: v.optional(v.pipe(v.string(), v.transform((s) => new Date(s)))),
  }),
  context: v.object({ userId: v.string(), orgId: v.optional(v.string()) }),
  defaultConfig: { start: new Date("2025-01-01"), end: new Date("2025-03-01") },
  logic: ({ config, context }) => {
    const pct = diffusionBezier({ curve: gradual, start: config.start!, end: config.end! });
    return rollout(hashContext(context), pct);
  },
});

// defineFlag takes a FeatureDef + config — name is inferred from the feature
const newDashboardFeature = defineFeature({ name: "new-dashboard" });
const newDashboard = defineFlag(newDashboardFeature, {
  default: false,
  rules: [betaRule],
  strategy: "any",
});
// newDashboard.name === "new-dashboard"

const flagService = createFlagService({ flags: [newDashboard], repo: createMemoryFlagConfigRepo() });

await flagService.evaluate(newDashboard, { userId: "u1", orgId: "o1" });
await flagService.setConfigOverride(betaRule, { start: "2025-02-01", end: "2025-04-01" });
await flagService.setConfigOverride("beta-rollout", { ... }); // also accepts string
await flagService.rollbackLastConfig(betaRule);
```

## Helpers (flag/helpers)

| Helper | Description |
|--------|-------------|
| `hashContext(context)` | Hash to [0,1] |
| `rollout(input, threshold)` | `input < threshold` → enabled |
| `diffusionBezier({ curve, start, end, at? })` | Time-based % via bezier curve |
| `diffusionStepped({ steps, start, end, at? })` | Discrete steps over time |

## Types

- `RuleDef<N, CConfig, CContext>` — extends `Inspectable<N>`
- `FlagDef<N>` — extends `Inspectable<N>`, `feature: FeatureDef<N>`, `name: N`
- `RuleRef = { name: string } | string` — accepted by all service methods

## API

`evaluate`, `setConfigOverride`, `getLatest`, `listConfigHistory`, `rollbackLastConfig`
