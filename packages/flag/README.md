# @justwant/flag

Feature flags with typed rules, config overrides, and rollout helpers. Uses `@justwant/bezier` for time-based diffusion curves.

## Installation

```bash
bun add @justwant/flag
```

For schema validation: `bun add @standard-schema/spec` (optional, use valibot, zod, etc.)

## Subpaths

| Path | Description |
|------|-------------|
| `@justwant/flag` | Core: defineRule, defineFlag, createFlagService |
| `@justwant/flag/helpers` | Rollout utilities: rollout, hashContext, diffusionBezier, diffusionStepped |
| `@justwant/flag/errors` | FlagError, FlagValidationError, RuleNotFoundError |

## Usage

### defineRule + defineFlag

```ts
import {
  createFlagService,
  createMemoryFlagConfigRepo,
  defineFlag,
  defineRule,
} from "@justwant/flag";
import { diffusionBezier, hashContext, rollout } from "@justwant/flag/helpers";
import { gradual } from "@justwant/bezier/feature";
import * as v from "valibot";

const betaRule = defineRule({
  id: "beta-rollout",
  config: v.object({
    start: v.optional(v.pipe(v.string(), v.transform((s) => new Date(s)))),
    end: v.optional(v.pipe(v.string(), v.transform((s) => new Date(s)))),
  }),
  context: v.object({ userId: v.string(), orgId: v.optional(v.string()) }),
  defaultConfig: { start: new Date("2025-01-01"), end: new Date("2025-03-01") },
  logic: ({ config, context }) => {
    const pct = diffusionBezier({
      curve: gradual,
      start: config.start!,
      end: config.end!,
    });
    const hash = hashContext(context); // or hashContext(context.userId)
    return rollout(hash, pct);
  },
});

const newDashboard = defineFlag({
  id: "new-dashboard",
  default: false,
  rules: [betaRule],
  strategy: "any",
});

const repo = createMemoryFlagConfigRepo();
const flagService = createFlagService({ flags: [newDashboard], repo });

await flagService.setConfigOverride(betaRule, {
  start: "2025-02-01",
  end: "2025-04-01",
});

const enabled = await flagService.evaluate(newDashboard, {
  userId: "u1",
  orgId: "o1",
});

// Optional: override remote config for this evaluation only
const forced = await flagService.evaluate(newDashboard, context, {
  "beta-rollout": { start: "2025-03-01", end: "2025-05-01" },
});

const history = await flagService.listConfigHistory(betaRule);
await flagService.rollbackLastConfig(betaRule);
```

### Helpers (`@justwant/flag/helpers`)

Import rollout utilities independently: `import { rollout, hashContext, diffusionBezier, diffusionStepped } from "@justwant/flag/helpers"`

- **hashContext(context)** — Hash string or object to [0,1] (uses @justwant/crypto). Use with rollout.
- **rollout(input, threshold)** — `input` ∈ [0,1], `threshold` ∈ [0,1]. Returns `input < threshold`.
- **diffusionBezier({ curve, start, end, at? })** — Time-based percentage using Bézier curve.
- **diffusionStepped({ steps, start, end, at? })** — Discrete steps with interpolation.

### Config overrides

- **setConfigOverride(rule, config)** — Adds override. Validates against rule schema.
- **getLatest(rule)** — Last active override (excludes rolledBack).
- **listConfigHistory(rule, opts?)** — Full history including rolledBack.
- **rollbackLastConfig(rule)** — Soft delete (marks `rolledBack: true`). No-op if none.

### Repo

Provide your own `FlagConfigRepo` (create, findOne, findMany, count, update). Use `createMemoryFlagConfigRepo()` for tests.

## License

MIT
