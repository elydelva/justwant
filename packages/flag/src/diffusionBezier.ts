/**
 * @justwant/flag — diffusionBezier
 * Time-based diffusion using Bézier curve. Progress from start to end → percentage [0,1].
 */

import type { BezierCurve } from "@justwant/bezier";

export interface DiffusionBezierOptions {
  curve: BezierCurve;
  start: Date;
  end: Date;
  at?: Date;
}

/**
 * Compute diffusion percentage at a given time using a Bézier curve.
 * progress = (at - start) / (end - start) clamped [0,1]
 * Returns curve.at(progress) ∈ [0,1]
 */
export function diffusionBezier(options: DiffusionBezierOptions): number {
  const { curve, start, end, at = new Date() } = options;
  const startMs = start.getTime();
  const endMs = end.getTime();
  const atMs = at.getTime();
  const duration = endMs - startMs;
  if (duration <= 0) return 0;
  const progress = Math.max(0, Math.min(1, (atMs - startMs) / duration));
  return curve.at(progress);
}
