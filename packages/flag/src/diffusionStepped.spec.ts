import { describe, expect, test } from "bun:test";
import { diffusionStepped } from "./helpers.js";

describe("diffusionStepped", () => {
  test("interpolates between steps", () => {
    const start = new Date("2025-01-01");
    const end = new Date("2025-02-01");
    const steps = [0.1, 0.25, 0.5, 1];

    const atStart = new Date("2025-01-01");
    expect(diffusionStepped({ steps, start, end, at: atStart })).toBeCloseTo(0.1, 2);

    const atEnd = new Date("2025-02-01");
    expect(diffusionStepped({ steps, start, end, at: atEnd })).toBeCloseTo(1, 2);

    const atMid = new Date("2025-01-15");
    const pct = diffusionStepped({ steps, start, end, at: atMid });
    expect(pct).toBeGreaterThan(0.1);
    expect(pct).toBeLessThan(1);
  });

  test("returns 0 before start", () => {
    const start = new Date("2025-01-01");
    const end = new Date("2025-03-01");
    const at = new Date("2024-12-31");
    expect(diffusionStepped({ steps: [0.5, 1], start, end, at })).toBe(0);
  });

  test("returns 0 when steps empty or duration 0", () => {
    const d = new Date("2025-01-01");
    expect(diffusionStepped({ steps: [], start: d, end: d })).toBe(0);
    expect(diffusionStepped({ steps: [0.5], start: d, end: d })).toBe(0);
  });

  test("single step returns that value at end", () => {
    const start = new Date("2025-01-01");
    const end = new Date("2025-02-01");
    const at = new Date("2025-02-01");
    expect(diffusionStepped({ steps: [0.3], start, end, at })).toBe(0.3);
  });
});
