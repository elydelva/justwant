import { describe, expect, test } from "bun:test";
import { fastRollout, gradual, slowRollout } from "./feature.js";

describe("feature presets", () => {
  describe("slowRollout", () => {
    test("at(0) = 0", () => expect(slowRollout.at(0)).toBe(0));
    test("at(1) = 1", () => expect(slowRollout.at(1)).toBe(1));
    test("at(0.25) < 0.25 (little adoption early)", () =>
      expect(slowRollout.at(0.25)).toBeLessThan(0.25));
  });

  describe("fastRollout", () => {
    test("at(0) = 0", () => expect(fastRollout.at(0)).toBe(0));
    test("at(1) = 1", () => expect(fastRollout.at(1)).toBe(1));
    test("at(0.25) > 0.25 (quick adoption early)", () =>
      expect(fastRollout.at(0.25)).toBeGreaterThan(0.25));
  });

  describe("gradual", () => {
    test("at(0) = 0", () => expect(gradual.at(0)).toBe(0));
    test("at(1) = 1", () => expect(gradual.at(1)).toBe(1));
    test("at(0.5) ≈ 0.5 (progressive)", () => expect(gradual.at(0.5)).toBeCloseTo(0.5, 1));
  });
});
