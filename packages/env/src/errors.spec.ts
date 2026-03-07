import { describe, expect, test } from "bun:test";
import { EnvironmentError, formatSchemaIssues } from "./errors.js";

describe("EnvironmentError", () => {
  test("extends Error and has name EnvironmentError", () => {
    const err = new EnvironmentError([{ key: "FOO", message: "Invalid" }]);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("EnvironmentError");
  });

  test("message includes count and formatted issues", () => {
    const err = new EnvironmentError([
      { key: "DATABASE_URL", message: "Invalid URL" },
      { key: "PORT", message: "Must be number" },
    ]);
    expect(err.message).toContain("2 invalid environment variable(s)");
    expect(err.message).toContain("DATABASE_URL");
    expect(err.message).toContain("Invalid URL");
    expect(err.message).toContain("PORT");
    expect(err.message).toContain("Must be number");
  });

  test("issues property is readonly array", () => {
    const issues = [{ key: "X", message: "Bad" }];
    const err = new EnvironmentError(issues);
    expect(err.issues).toEqual(issues);
    expect(err.issues).toHaveLength(1);
  });

  test("handles empty issues array", () => {
    const err = new EnvironmentError([]);
    expect(err.message).toContain("0 invalid");
    expect(err.issues).toEqual([]);
  });
});

describe("formatSchemaIssues", () => {
  test("maps issues to EnvIssue with key and message", () => {
    const result = formatSchemaIssues("PORT", [
      { message: "Expected number" },
      { message: "Too small" },
    ]);
    expect(result).toEqual([
      { key: "PORT", message: "Expected number" },
      { key: "PORT", message: "Too small" },
    ]);
  });

  test("returns empty array when issues is undefined", () => {
    const result = formatSchemaIssues("X", undefined);
    expect(result).toEqual([]);
  });

  test("returns empty array when issues is not array", () => {
    const result = formatSchemaIssues("X", null as unknown as readonly { message?: string }[]);
    expect(result).toEqual([]);
  });

  test("uses 'Invalid' when message is not string", () => {
    const result = formatSchemaIssues("X", [{ message: 123 as unknown as string }, {}]);
    expect(result).toEqual([
      { key: "X", message: "Invalid" },
      { key: "X", message: "Invalid" },
    ]);
  });

  test("handles empty issues array", () => {
    const result = formatSchemaIssues("Y", []);
    expect(result).toEqual([]);
  });
});
