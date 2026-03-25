import { describe, expect, it } from "bun:test";
import { escapeIdentifier, escapeStringLiteral } from "./escape.js";

describe("escapeIdentifier", () => {
  it("wraps with double quotes", () => {
    expect(escapeIdentifier("table")).toBe('"table"');
  });

  it("escapes embedded double quotes", () => {
    expect(escapeIdentifier('ta"ble')).toBe('"ta""ble"');
  });

  it("handles empty string", () => {
    expect(escapeIdentifier("")).toBe('""');
  });
});

describe("escapeStringLiteral", () => {
  it("wraps with single quotes", () => {
    expect(escapeStringLiteral("value")).toBe("'value'");
  });

  it("escapes embedded single quotes", () => {
    expect(escapeStringLiteral("it's")).toBe("'it''s'");
  });

  it("handles empty string", () => {
    expect(escapeStringLiteral("")).toBe("''");
  });
});
