/**
 * @justwant/bezier/animation — design/UI easing presets
 * Same math as classic, design-oriented naming.
 */

import { createBezierCurve } from "./createBezierCurve.js";
import type { BezierCurve } from "./types.js";

/** Ease-in: slow at start. */
export const easeIn: BezierCurve = createBezierCurve({
  p1x: 0.42,
  p1y: 0,
  p2x: 1,
  p2y: 1,
});

/** Ease-out: slow at end. */
export const easeOut: BezierCurve = createBezierCurve({
  p1x: 0,
  p1y: 0,
  p2x: 0.58,
  p2y: 1,
});

/** Ease-in-out: slow at both ends. */
export const easeInOut: BezierCurve = createBezierCurve({
  p1x: 0.42,
  p1y: 0,
  p2x: 0.58,
  p2y: 1,
});
