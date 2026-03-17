/**
 * @justwant/bezier/classic — CSS-like presets
 */

import { createBezierCurve } from "./createBezierCurve.js";
import type { BezierCurve } from "./types.js";

/** Linear: p1x=0.333, p1y=0.333, p2x=0.667, p2y=0.667 */
export const linear: BezierCurve = createBezierCurve({
  p1x: 0.333,
  p1y: 0.333,
  p2x: 0.667,
  p2y: 0.667,
});

/** Ease-in: slow at start. p1x=0.42, p1y=0, p2x=1, p2y=1 */
export const easeIn: BezierCurve = createBezierCurve({
  p1x: 0.42,
  p1y: 0,
  p2x: 1,
  p2y: 1,
});

/** Ease-out: slow at end. p1x=0, p1y=0, p2x=0.58, p2y=1 */
export const easeOut: BezierCurve = createBezierCurve({
  p1x: 0,
  p1y: 0,
  p2x: 0.58,
  p2y: 1,
});

/** Ease-in-out: slow at both ends. p1x=0.42, p1y=0, p2x=0.58, p2y=1 */
export const easeInOut: BezierCurve = createBezierCurve({
  p1x: 0.42,
  p1y: 0,
  p2x: 0.58,
  p2y: 1,
});
