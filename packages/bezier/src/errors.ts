/**
 * @justwant/bezier — errors
 */

/** Base error for @justwant/bezier. */
export class BezierError extends Error {
  override name = "BezierError";

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, BezierError.prototype);
  }
}

/** Thrown when p1x, p1y, p2x, p2y are outside [0,1]. */
export class InvalidBezierParamsError extends BezierError {
  override name = "InvalidBezierParamsError";

  constructor(
    message: string,
    public readonly params: { p1x: number; p1y: number; p2x: number; p2y: number }
  ) {
    super(message);
    Object.setPrototypeOf(this, InvalidBezierParamsError.prototype);
  }
}
