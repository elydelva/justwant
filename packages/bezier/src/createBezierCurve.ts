/**
 * @justwant/bezier — createBezierCurve
 * Cubic Bézier: B(t) = (1-t)³P0 + 3(1-t)²t P1 + 3(1-t)t² P2 + t³P3
 * P0=(0,0), P3=(1,1). Y component only (easing).
 */

import { InvalidBezierParamsError } from "./errors.js";
import type { BezierCurve, BezierParams } from "./types.js";

const inRange = (v: number) => v >= 0 && v <= 1;

/** Validate params and throw InvalidBezierParamsError if any is outside [0,1]. */
function validateParams(params: BezierParams): void {
  const { p1x, p1y, p2x, p2y } = params;
  if (!inRange(p1x) || !inRange(p1y) || !inRange(p2x) || !inRange(p2y)) {
    throw new InvalidBezierParamsError(
      `Bezier params must be in [0,1]: p1x=${p1x}, p1y=${p1y}, p2x=${p2x}, p2y=${p2y}`,
      { p1x, p1y, p2x, p2y }
    );
  }
}

/** Evaluate cubic Bézier y at t. P0=(0,0), P3=(1,1). */
function bezierY(t: number, p1y: number, p2y: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  return mt3 * 0 + 3 * mt2 * t * p1y + 3 * mt * t2 * p2y + t3 * 1;
}

/**
 * Create a cubic Bézier curve from control points.
 * @param params - p1x, p1y, p2x, p2y ∈ [0,1]
 * @returns BezierCurve with at(t) returning y ∈ [0,1] (clamped)
 */
export function createBezierCurve(params: BezierParams): BezierCurve {
  validateParams(params);
  const { p1y, p2y } = params;

  const curve: BezierCurve = {
    at(t: number): number {
      const clampedT = Math.max(0, Math.min(1, t));
      const y = bezierY(clampedT, p1y, p2y);
      return Math.max(0, Math.min(1, y));
    },
  };

  return curve;
}
