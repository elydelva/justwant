# @justwant/bezier

Zero-dependency cubic Bézier curves. Computes smooth `[0,1] → [0,1]` curves matching CSS `cubic-bezier()`. Used for animation easing and feature rollout diffusion.

## Install

```bash
bun add @justwant/bezier
```

## Entry points

| Entry point | Exports |
|-------------|---------|
| `@justwant/bezier` | `createBezierCurve`, types, errors |
| `@justwant/bezier/classic` | `linear`, `easeIn`, `easeOut`, `easeInOut` |
| `@justwant/bezier/animation` | `easeIn`, `easeOut`, `easeInOut` (design-oriented aliases) |
| `@justwant/bezier/feature` | `slowRollout`, `fastRollout`, `gradual` |

## Usage

```ts
import { createBezierCurve, InvalidBezierParamsError } from "@justwant/bezier";

const curve = createBezierCurve({ p1x: 0.42, p1y: 0, p2x: 0.58, p2y: 1 });
curve.at(0);    // 0
curve.at(0.5);  // ~0.5
curve.at(1);    // 1
// t outside [0,1] is clamped silently

// Classic presets (CSS-equivalent)
import { linear, easeIn, easeOut, easeInOut } from "@justwant/bezier/classic";

// Animation presets (same curves, design-oriented names)
import { easeIn, easeOut, easeInOut } from "@justwant/bezier/animation";

// Feature rollout presets (used by @justwant/flag diffusionBezier)
import { slowRollout, fastRollout, gradual } from "@justwant/bezier/feature";
slowRollout.at(0.2); // ~0.05 — slow adoption early
```

## `createBezierCurve(params)`

```ts
function createBezierCurve(params: BezierParams): BezierCurve
// Throws InvalidBezierParamsError if any coordinate is outside [0,1]
```

### `BezierParams`
| Field | Type | Constraint |
|-------|------|-----------|
| `p1x` | `number` | `[0,1]` |
| `p1y` | `number` | `[0,1]` |
| `p2x` | `number` | `[0,1]` |
| `p2y` | `number` | `[0,1]` |

### `BezierCurve`
```ts
interface BezierCurve { at(t: number): number }
```

## Presets

### Classic — `@justwant/bezier/classic`
| Export | p1x | p1y | p2x | p2y | Description |
|--------|-----|-----|-----|-----|-------------|
| `linear` | 0.333 | 0.333 | 0.667 | 0.667 | Uniform pace |
| `easeIn` | 0.42 | 0 | 1 | 1 | Slow start, fast end |
| `easeOut` | 0 | 0 | 0.58 | 1 | Fast start, slow end |
| `easeInOut` | 0.42 | 0 | 0.58 | 1 | Slow at both ends |

### Animation — `@justwant/bezier/animation`
Same as classic minus `linear`. Exports: `easeIn`, `easeOut`, `easeInOut`.

### Feature — `@justwant/bezier/feature`
| Export | p1x | p1y | p2x | p2y | Adoption shape |
|--------|-----|-----|-----|-----|---------------|
| `slowRollout` | 0.2 | 0 | 0.8 | 1 | Slow early, ramps in middle |
| `fastRollout` | 0.6 | 0.5 | 0.4 | 1 | High adoption early, flattens |
| `gradual` | 0.33 | 0.33 | 0.67 | 0.67 | Near-linear progressive |

## Errors

```ts
class BezierError extends Error { name: "BezierError" }
class InvalidBezierParamsError extends BezierError {
  name: "InvalidBezierParamsError";
  params: { p1x: number; p1y: number; p2x: number; p2y: number };
}
```

## Integration

`@justwant/flag` `diffusionBezier` accepts presets from `@justwant/bezier/feature`.
