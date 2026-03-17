import { describe, expect, test } from "bun:test";
import { hashContext, rollout } from "./helpers.js";

describe("hashContext", () => {
  test("returns number in [0,1] for string", () => {
    const v = hashContext("user-123");
    expect(typeof v).toBe("number");
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  });

  test("returns number in [0,1] for object", () => {
    const v = hashContext({ userId: "u1", orgId: "o1" });
    expect(typeof v).toBe("number");
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  });

  test("same input yields same output (deterministic)", () => {
    expect(hashContext("foo")).toBe(hashContext("foo"));
    expect(hashContext({ a: 1, b: 2 })).toBe(hashContext({ a: 1, b: 2 }));
    expect(hashContext({ b: 2, a: 1 })).toBe(hashContext({ a: 1, b: 2 }));
  });

  test("different inputs yield different outputs", () => {
    expect(hashContext("foo")).not.toBe(hashContext("bar"));
    expect(hashContext({ userId: "u1" })).not.toBe(hashContext({ userId: "u2" }));
  });

  test("works with rollout", () => {
    const hash = hashContext("user-42");
    expect(rollout(hash, 0)).toBe(false);
    expect(rollout(hash, 1)).toBe(true);
  });
});
