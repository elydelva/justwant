# @justwant/flag

Feature flags with typed rules, config overrides, rollout. Uses @justwant/bezier for diffusion curves.

## Usage

```ts
import { createFlagService, createMemoryFlagConfigRepo, defineFlag, defineRule } from "@justwant/flag";
import { diffusionBezier, hashContext, rollout } from "@justwant/flag/helpers";
import { gradual } from "@justwant/bezier/feature";

const betaRule = defineRule({
  id: "beta-rollout",
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

const newDashboard = defineFlag({ id: "new-dashboard", default: false, rules: [betaRule], strategy: "any" });
const flagService = createFlagService({ flags: [newDashboard], repo: createMemoryFlagConfigRepo() });

await flagService.evaluate(newDashboard, { userId: "u1", orgId: "o1" });
await flagService.setConfigOverride(betaRule, { start: "2025-02-01", end: "2025-04-01" });
await flagService.rollbackLastConfig(betaRule);
```

## Helpers (flag/helpers)

| Helper | Description |
|--------|-------------|
| hashContext(context) | Hash to [0,1] |
| rollout(input, threshold) | input < threshold → enabled |
| diffusionBezier({ curve, start, end, at? }) | Time-based % |
| diffusionStepped({ steps, start, end, at? }) | Discrete steps |

## API

evaluate, setConfigOverride, getLatest, listConfigHistory, rollbackLastConfig
