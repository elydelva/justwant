import { describe, expect, test } from "bun:test";
import { parseCookies, serializeCookie } from "./primitive.js";

describe("parseCookies", () => {
  test("returns empty object when header is null", () => {
    expect(parseCookies(null)).toEqual({});
  });

  test("returns empty object when header is undefined", () => {
    expect(parseCookies(undefined)).toEqual({});
  });

  test("returns empty object when header is empty string", () => {
    expect(parseCookies("")).toEqual({});
  });

  test("parses single cookie", () => {
    expect(parseCookies("session=abc123")).toEqual({ session: "abc123" });
  });

  test("parses multiple cookies", () => {
    expect(parseCookies("a=1; b=2; c=3")).toEqual({ a: "1", b: "2", c: "3" });
  });

  test("URL-decodes values", () => {
    expect(parseCookies("name=hello%20world")).toEqual({ name: "hello world" });
  });

  test("trims whitespace around name and value", () => {
    expect(parseCookies("  foo  =  bar  ")).toEqual({ foo: "bar" });
  });

  test("skips malformed pairs without equals", () => {
    expect(parseCookies("invalid; valid=ok")).toEqual({ valid: "ok" });
  });

  test("skips pairs with empty name", () => {
    expect(parseCookies("=value; foo=bar")).toEqual({ foo: "bar" });
  });

  test("later cookie overwrites earlier with same name", () => {
    expect(parseCookies("a=1; a=2")).toEqual({ a: "2" });
  });

  test("handles invalid URL encoding gracefully", () => {
    const result = parseCookies("x=hello%");
    expect(result.x).toBeDefined();
  });
});

describe("serializeCookie", () => {
  test("serializes name and value", () => {
    expect(serializeCookie("session", "abc")).toBe("session=abc");
  });

  test("URL-encodes name and value", () => {
    expect(serializeCookie("name", "hello world")).toContain("hello%20world");
  });

  test("adds Path when option provided", () => {
    const result = serializeCookie("x", "y", { path: "/" });
    expect(result).toContain("Path=/");
  });

  test("adds Domain when option provided", () => {
    const result = serializeCookie("x", "y", { domain: ".example.com" });
    expect(result).toContain("Domain=.example.com");
  });

  test("adds Max-Age when option provided", () => {
    const result = serializeCookie("x", "y", { maxAge: 3600 });
    expect(result).toContain("Max-Age=3600");
  });

  test("adds Expires when option provided", () => {
    const date = new Date("2025-01-01T00:00:00Z");
    const result = serializeCookie("x", "y", { expires: date });
    expect(result).toContain("Expires=");
    expect(result).toContain("Wed, 01 Jan 2025");
  });

  test("adds HttpOnly when true", () => {
    const result = serializeCookie("x", "y", { httpOnly: true });
    expect(result).toContain("HttpOnly");
  });

  test("adds Secure when true", () => {
    const result = serializeCookie("x", "y", { secure: true });
    expect(result).toContain("Secure");
  });

  test("adds SameSite when provided", () => {
    expect(serializeCookie("x", "y", { sameSite: "strict" })).toContain("SameSite=strict");
    expect(serializeCookie("x", "y", { sameSite: "lax" })).toContain("SameSite=lax");
    expect(serializeCookie("x", "y", { sameSite: "none" })).toContain("SameSite=none");
  });

  test("combines multiple options", () => {
    const result = serializeCookie("session", "xyz", {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 86400,
    });
    expect(result).toContain("session=xyz");
    expect(result).toContain("Path=/");
    expect(result).toContain("HttpOnly");
    expect(result).toContain("Secure");
    expect(result).toContain("SameSite=lax");
    expect(result).toContain("Max-Age=86400");
  });
});
