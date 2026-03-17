# @justwant/bezier

Cubic Bézier curves for easing. Core + presets (classic, feature, animation).

## Usage

```ts
import { createBezierCurve } from "@justwant/bezier";
const curve = createBezierCurve({ p1x: 0.42, p1y: 0, p2x: 0.58, p2y: 1 });
curve.at(0.5); // y ∈ [0,1]

import { linear, easeIn, easeOut, easeInOut } from "@justwant/bezier/classic";
import { gradual, slowRollout, fastRollout } from "@justwant/bezier/feature";
```

## Subpaths

classic, feature, animation, errors
