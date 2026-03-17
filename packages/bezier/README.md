# @justwant/bezier

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Cubic Bézier curves for easing and rollout curves. Core minimal (no presets), presets in subpaths by usage domain.

## Installation

```bash
bun add @justwant/bezier
# or
npm install @justwant/bezier
# or
pnpm add @justwant/bezier
```

## Usage

### Core (`@justwant/bezier`)

Custom params only — no presets in core.

```ts
import { createBezierCurve } from "@justwant/bezier";

const curve = createBezierCurve({ p1x: 0.42, p1y: 0, p2x: 0.58, p2y: 1 });
curve.at(0);   // 0
curve.at(1);   // 1
curve.at(0.5); // ~0.5 (y clamped to [0,1])
```

### Classic (`@justwant/bezier/classic`)

CSS-like presets: linear, ease-in, ease-out, ease-in-out.

```ts
import { linear, easeIn, easeOut, easeInOut } from "@justwant/bezier/classic";

linear.at(0.5);    // 0.5
easeIn.at(0.5);   // < 0.5 (slow at start)
easeOut.at(0.5);  // > 0.5 (slow at end)
easeInOut.at(0.5); // ≈ 0.5
```

### Feature (`@justwant/bezier/feature`)

Rollout/adoption curves for feature flags (used by `@justwant/flag` for `diffusionBezier`).

```ts
import { slowRollout, fastRollout, gradual } from "@justwant/bezier/feature";
```

### Animation (`@justwant/bezier/animation`)

Design/UI easing presets.

```ts
import { easeIn, easeOut, easeInOut } from "@justwant/bezier/animation";
```

## API

| Export | Description |
|--------|-------------|
| `createBezierCurve({ p1x, p1y, p2x, p2y })` | Create curve from control points (all ∈ [0,1]) |
| `BezierCurve.at(t)` | Evaluate at t ∈ [0,1], returns y ∈ [0,1] (clamped) |
| `InvalidBezierParamsError` | Thrown when params outside [0,1] |

## Subpaths

| Path | Presets |
|------|---------|
| `@justwant/bezier` | createBezierCurve, types, errors |
| `@justwant/bezier/classic` | linear, easeIn, easeOut, easeInOut |
| `@justwant/bezier/feature` | slowRollout, fastRollout, gradual |
| `@justwant/bezier/animation` | easeIn, easeOut, easeInOut |
| `@justwant/bezier/errors` | BezierError, InvalidBezierParamsError |

## Integration

- **@justwant/flag** — uses `diffusionBezier` with `gradual`, `slowRollout`, `fastRollout` from `@justwant/bezier/feature` for time-based rollout curves

## License

MIT
