import { describe, expect, test } from "bun:test";
import { createBezierCurve } from "./createBezierCurve.js";
import { InvalidBezierParamsError } from "./errors.js";

describe("createBezierCurve", () => {
  test("at(0) returns 0", () => {
    const curve = createBezierCurve({ p1x: 0.42, p1y: 0, p2x: 0.58, p2y: 1 });
    expect(curve.at(0)).toBe(0);
  });

  test("at(1) returns 1", () => {
    const curve = createBezierCurve({ p1x: 0.42, p1y: 0, p2x: 0.58, p2y: 1 });
    expect(curve.at(1)).toBe(1);
  });

  test("custom params produce expected intermediate values", () => {
    const curve = createBezierCurve({ p1x: 0.42, p1y: 0, p2x: 0.58, p2y: 1 });
    const y05 = curve.at(0.5);
    expect(y05).toBeGreaterThan(0);
    expect(y05).toBeLessThan(1);
    expect(typeof y05).toBe("number");
  });

  test("linear-like params: at(0.5) ≈ 0.5", () => {
    const curve = createBezierCurve({ p1x: 0.333, p1y: 0.333, p2x: 0.667, p2y: 0.667 });
    const y = curve.at(0.5);
    expect(y).toBeCloseTo(0.5, 2);
  });

  test("clamps t outside [0,1] to [0,1]", () => {
    const curve = createBezierCurve({ p1x: 0.42, p1y: 0, p2x: 0.58, p2y: 1 });
    expect(curve.at(-0.5)).toBe(0);
    expect(curve.at(1.5)).toBe(1);
  });

  test("returns number in [0,1] for t in [0,1]", () => {
    const curve = createBezierCurve({ p1x: 0.2, p1y: 0, p2x: 0.8, p2y: 1 });
    for (let t = 0; t <= 1; t += 0.1) {
      const y = curve.at(t);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(1);
    }
  });
});
