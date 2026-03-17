/**
 * @justwant/bezier — types
 */

/** Control points for cubic Bézier (P0=(0,0), P3=(1,1)). p1x,p1y,p2x,p2y ∈ [0,1]. */
export interface BezierParams {
  p1x: number;
  p1y: number;
  p2x: number;
  p2y: number;
}

/** Cubic Bézier curve. t ∈ [0,1] → y ∈ [0,1] (clamped). */
export interface BezierCurve {
  /** Evaluate curve at t ∈ [0,1]. Returns y clamped to [0,1]. */
  at(t: number): number;
}
