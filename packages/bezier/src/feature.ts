/**
 * @justwant/bezier/feature — rollout/adoption presets
 * Used by @justwant/flag for diffusionBezier.
 */

import { createBezierCurve } from "./createBezierCurve.js";
import type { BezierCurve } from "./types.js";

/** Slow rollout: little adoption at start, then ramp. p1x=0.2, p1y=0, p2x=0.8, p2y=1 */
export const slowRollout: BezierCurve = createBezierCurve({
  p1x: 0.2,
  p1y: 0,
  p2x: 0.8,
  p2y: 1,
});

/** Fast rollout: quick adoption at start. p1x=0.6, p1y=0.5, p2x=0.4, p2y=1 */
export const fastRollout: BezierCurve = createBezierCurve({
  p1x: 0.6,
  p1y: 0.5,
  p2x: 0.4,
  p2y: 1,
});

/** Gradual: progressive adoption. p1x=0.33, p1y=0.33, p2x=0.67, p2y=0.67 */
export const gradual: BezierCurve = createBezierCurve({
  p1x: 0.33,
  p1y: 0.33,
  p2x: 0.67,
  p2y: 0.67,
});
