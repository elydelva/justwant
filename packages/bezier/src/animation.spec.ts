import { describe, expect, test } from "bun:test";
import { easeIn, easeInOut, easeOut } from "./animation.js";

describe("animation presets", () => {
  describe("easeIn", () => {
    test("at(0) = 0", () => expect(easeIn.at(0)).toBe(0));
    test("at(1) = 1", () => expect(easeIn.at(1)).toBe(1));
    test("easing: slow at start", () => expect(easeIn.at(0.25)).toBeLessThan(0.25));
  });

  describe("easeOut", () => {
    test("at(0) = 0", () => expect(easeOut.at(0)).toBe(0));
    test("at(1) = 1", () => expect(easeOut.at(1)).toBe(1));
    test("easing: slow at end", () => expect(easeOut.at(0.75)).toBeGreaterThan(0.75));
  });

  describe("easeInOut", () => {
    test("at(0) = 0", () => expect(easeInOut.at(0)).toBe(0));
    test("at(1) = 1", () => expect(easeInOut.at(1)).toBe(1));
    test("easing: symmetric", () => expect(easeInOut.at(0.5)).toBeCloseTo(0.5, 1));
  });
});
