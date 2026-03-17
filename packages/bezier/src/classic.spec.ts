import { describe, expect, test } from "bun:test";
import { easeIn, easeInOut, easeOut, linear } from "./classic.js";

function assertMonotonic(at: (t: number) => number) {
  let prev = -1;
  for (let t = 0; t <= 1; t += 0.05) {
    const y = at(t);
    expect(y).toBeGreaterThanOrEqual(prev);
    prev = y;
  }
}

describe("classic presets", () => {
  describe("linear", () => {
    test("at(0) = 0", () => expect(linear.at(0)).toBe(0));
    test("at(1) = 1", () => expect(linear.at(1)).toBe(1));
    test("at(0.5) ≈ 0.5", () => expect(linear.at(0.5)).toBeCloseTo(0.5, 2));
    test("monotonic", () => assertMonotonic((t) => linear.at(t)));
  });

  describe("easeIn", () => {
    test("at(0) = 0", () => expect(easeIn.at(0)).toBe(0));
    test("at(1) = 1", () => expect(easeIn.at(1)).toBe(1));
    test("at(0.25) < 0.25 (slow start)", () => expect(easeIn.at(0.25)).toBeLessThan(0.25));
    test("monotonic", () => assertMonotonic((t) => easeIn.at(t)));
  });

  describe("easeOut", () => {
    test("at(0) = 0", () => expect(easeOut.at(0)).toBe(0));
    test("at(1) = 1", () => expect(easeOut.at(1)).toBe(1));
    test("at(0.75) > 0.75 (slow end)", () => expect(easeOut.at(0.75)).toBeGreaterThan(0.75));
    test("monotonic", () => assertMonotonic((t) => easeOut.at(t)));
  });

  describe("easeInOut", () => {
    test("at(0) = 0", () => expect(easeInOut.at(0)).toBe(0));
    test("at(1) = 1", () => expect(easeInOut.at(1)).toBe(1));
    test("at(0.5) ≈ 0.5", () => expect(easeInOut.at(0.5)).toBeCloseTo(0.5, 1));
    test("monotonic", () => assertMonotonic((t) => easeInOut.at(t)));
  });
});
