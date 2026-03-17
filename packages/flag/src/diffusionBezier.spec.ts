import { describe, expect, test } from "bun:test";
import { createBezierCurve } from "@justwant/bezier";
import { gradual } from "@justwant/bezier/feature";
import { diffusionBezier } from "./helpers.js";

describe("diffusionBezier", () => {
  test("returns 0 before start", () => {
    const start = new Date("2025-01-01");
    const end = new Date("2025-03-01");
    const at = new Date("2024-12-31");
    const curve = createBezierCurve({ p1x: 0.5, p1y: 0.5, p2x: 0.5, p2y: 0.5 });
    expect(diffusionBezier({ curve, start, end, at })).toBe(0);
  });

  test("returns curve value at progress", () => {
    const start = new Date("2025-01-01");
    const end = new Date("2025-02-01");
    const at = new Date("2025-01-15");
    const curve = createBezierCurve({ p1x: 0.5, p1y: 0.5, p2x: 0.5, p2y: 0.5 });
    const pct = diffusionBezier({ curve, start, end, at });
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(1);
    expect(pct).toBeCloseTo(0.5, 1);
  });

  test("uses gradual preset from @justwant/bezier/feature", () => {
    const start = new Date("2025-01-01");
    const end = new Date("2025-03-01");
    const at = new Date("2025-02-01");
    const pct = diffusionBezier({ curve: gradual, start, end, at });
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(1);
  });

  test("defaults at to now when omitted", () => {
    const start = new Date("2020-01-01");
    const end = new Date("2030-01-01");
    const curve = createBezierCurve({ p1x: 0.33, p1y: 0.33, p2x: 0.67, p2y: 0.67 });
    const pct = diffusionBezier({ curve, start, end });
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(1);
  });

  test("returns 0 when duration is 0 or negative", () => {
    const d = new Date("2025-01-01");
    const curve = createBezierCurve({ p1x: 0.5, p1y: 0.5, p2x: 0.5, p2y: 0.5 });
    expect(diffusionBezier({ curve, start: d, end: d })).toBe(0);
  });
});
