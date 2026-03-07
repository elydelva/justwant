import { describe, expect, test } from "bun:test";
import { expandRecord, expandVars } from "./expand.js";

describe("expandVars", () => {
  test("replaces ${VAR} with value from vars", () => {
    const result = expandVars("hello ${NAME}", { NAME: "world" });
    expect(result).toBe("hello world");
  });

  test("replaces ${VAR:-default} when VAR is undefined", () => {
    const result = expandVars("hello ${MISSING:-fallback}", {});
    expect(result).toBe("hello fallback");
  });

  test("replaces ${VAR:-default} when VAR is empty string", () => {
    const result = expandVars("hello ${EMPTY:-fallback}", { EMPTY: "" });
    expect(result).toBe("hello fallback");
  });

  test("uses VAR when defined and non-empty (ignores default)", () => {
    const result = expandVars("hello ${NAME:-default}", { NAME: "world" });
    expect(result).toBe("hello world");
  });

  test("replaces multiple variables", () => {
    const result = expandVars("${A} ${B} ${C}", { A: "1", B: "2", C: "3" });
    expect(result).toBe("1 2 3");
  });

  test("returns empty string for undefined variable without default", () => {
    const result = expandVars("${MISSING}", {});
    expect(result).toBe("");
  });

  test("leaves unknown pattern unchanged when no match", () => {
    const result = expandVars("no vars here", {});
    expect(result).toBe("no vars here");
  });

  test("handles empty default", () => {
    const result = expandVars("${X:-}", {});
    expect(result).toBe("");
  });
});

describe("expandRecord", () => {
  test("returns copy when expand is false", () => {
    const input = { A: "1", B: "2" };
    const result = expandRecord(input, false);
    expect(result).toEqual({ A: "1", B: "2" });
    expect(result).not.toBe(input);
  });

  test("expands variables in values when expand is true", () => {
    const input = { A: "1", B: "${A}2", C: "${B}3" };
    const result = expandRecord(input, true);
    expect(result).toEqual({ A: "1", B: "12", C: "123" });
  });

  test("self-reference with default: A stays unexpanded when vars.A already has value", () => {
    const input = { A: "${A:-x}" };
    const result = expandRecord(input, true);
    expect(result.A).toBe("${A:-x}");
  });

  test("stops after max iterations to prevent infinite loop from circular refs", () => {
    const input = { A: "${B}", B: "${A}" };
    const result = expandRecord(input, true);
    expect(result).toHaveProperty("A");
    expect(result).toHaveProperty("B");
    expect(Object.keys(result)).toHaveLength(2);
  });

  test("handles empty record", () => {
    const result = expandRecord({}, true);
    expect(result).toEqual({});
  });

  test("handles values with no variables", () => {
    const input = { A: "plain", B: "text" };
    const result = expandRecord(input, true);
    expect(result).toEqual({ A: "plain", B: "text" });
  });
});
