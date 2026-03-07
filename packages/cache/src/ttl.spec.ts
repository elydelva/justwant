import { describe, expect, test } from "bun:test";
import { parseTtl } from "./ttl.js";

describe("parseTtl", () => {
  test("parses seconds", () => {
    expect(parseTtl("30s")).toBe(30_000);
    expect(parseTtl("1s")).toBe(1000);
  });

  test("parses minutes", () => {
    expect(parseTtl("5m")).toBe(300_000);
    expect(parseTtl("1m")).toBe(60_000);
  });

  test("parses hours", () => {
    expect(parseTtl("2h")).toBe(7_200_000);
    expect(parseTtl("1h")).toBe(3_600_000);
  });

  test("parses days", () => {
    expect(parseTtl("7d")).toBe(604_800_000);
    expect(parseTtl("1d")).toBe(86_400_000);
  });

  test("returns number as ms when given number", () => {
    expect(parseTtl(5000)).toBe(5000);
    expect(parseTtl(0)).toBe(0);
  });

  test("returns Date when given Date", () => {
    const future = new Date(Date.now() + 10_000);
    const result = parseTtl(future);
    expect(result).toBeInstanceOf(Date);
    expect((result as Date).getTime()).toBe(future.getTime());
  });

  test("returns undefined for invalid string", () => {
    expect(parseTtl("invalid")).toBeUndefined();
    expect(parseTtl("")).toBeUndefined();
  });
});
