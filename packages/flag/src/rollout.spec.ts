import { describe, expect, test } from "bun:test";
import { rollout } from "./helpers.js";

describe("rollout", () => {
  test("returns true when input < threshold", () => {
    expect(rollout(0.2, 0.3)).toBe(true);
    expect(rollout(0, 1)).toBe(true);
    expect(rollout(0.5, 0.6)).toBe(true);
  });

  test("returns false when input >= threshold", () => {
    expect(rollout(0.3, 0.3)).toBe(false);
    expect(rollout(0.5, 0.5)).toBe(false);
    expect(rollout(0.6, 0.5)).toBe(false);
    expect(rollout(1, 0.5)).toBe(false);
  });

  test("boundaries 0 and 1", () => {
    expect(rollout(0, 0.1)).toBe(true);
    expect(rollout(0.1, 0)).toBe(false);
    expect(rollout(1, 1)).toBe(false);
    expect(rollout(0.99, 1)).toBe(true);
  });
});
