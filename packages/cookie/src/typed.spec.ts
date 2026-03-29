import { describe, expect, test } from "bun:test";
import { createCookieStore, defineCookie, deleteCookie, setCookie } from "./typed.js";

describe("defineCookie", () => {
  test("returns TypedCookie with name and parse (parser shorthand)", () => {
    const cookie = defineCookie("session");
    expect(cookie.name).toBe("session");
    expect(cookie.parse("abc")).toBe("abc");
  });

  test("parse returns empty string when value undefined and no parser", () => {
    const cookie = defineCookie("x");
    expect(cookie.parse(undefined)).toBe("");
  });

  test("parse uses custom parser when provided (shorthand)", () => {
    const theme = defineCookie("theme", (v) => (v === "dark" ? "dark" : "light"));
    expect(theme.parse("dark")).toBe("dark");
    expect(theme.parse("light")).toBe("light");
    expect(theme.parse(undefined)).toBe("light");
  });

  test("parse uses schema with default fallback", () => {
    const schema = {
      "~standard": {
        validate: (v: unknown) =>
          v === "dark" || v === "light" ? { value: v } : { issues: [{ message: "Invalid" }] },
      },
    };
    const theme = defineCookie("theme", { schema, default: "light" });
    expect(theme.parse("dark")).toBe("dark");
    expect(theme.parse("invalid")).toBe("light");
    expect(theme.parse(undefined)).toBe("light");
  });

  test("parseWithMeta returns remove when onMismatch is remove", () => {
    const schema = {
      "~standard": {
        validate: (v: unknown) =>
          v === "ok" ? { value: v } : { issues: [{ message: "Invalid" }] },
      },
    };
    const cookie = defineCookie("x", { schema, default: "fallback", onMismatch: "remove" });
    expect(cookie.parseWithMeta("ok")).toEqual({ value: "ok" });
    expect(cookie.parseWithMeta("bad")).toEqual({ value: "fallback", remove: true });
  });
});

describe("setCookie", () => {
  test("returns serialized cookie string", () => {
    const result = setCookie("session", "abc123");
    expect(result).toContain("session=abc123");
  });

  test("includes options when provided", () => {
    const result = setCookie("x", "y", { path: "/", httpOnly: true });
    expect(result).toContain("Path=/");
    expect(result).toContain("HttpOnly");
  });
});

describe("deleteCookie", () => {
  test("returns cookie with empty value and maxAge 0", () => {
    const result = deleteCookie("session");
    expect(result).toContain("session=");
    expect(result).toContain("Max-Age=0");
  });

  test("includes path when provided", () => {
    const result = deleteCookie("session", { path: "/" });
    expect(result).toContain("Path=/");
  });
});

describe("createCookieStore", () => {
  const theme = defineCookie("theme", (v) => (v === "dark" ? "dark" : "light"));
  const session = defineCookie("session");

  test("parse returns typed object from header", () => {
    const store = createCookieStore({ theme, session });
    const parsed = store.parse("theme=dark; session=abc");
    expect(parsed.theme).toBe("dark");
    expect(parsed.session).toBe("abc");
  });

  test("parse applies parser for each cookie", () => {
    const store = createCookieStore({ theme, session });
    const parsed = store.parse("theme=invalid; session=xyz");
    expect(parsed.theme).toBe("light");
    expect(parsed.session).toBe("xyz");
  });

  test("parse returns empty object when header null", () => {
    const store = createCookieStore({ theme, session });
    const parsed = store.parse(null);
    expect(parsed.theme).toBe("light");
    expect(parsed.session).toBe("");
  });

  test("serialize returns Set-Cookie string for known cookie", () => {
    const store = createCookieStore({ theme, session });
    const result = store.serialize("theme", "dark");
    expect(result).toContain("theme=dark");
  });

  test("serialize throws for unknown cookie name", () => {
    const store = createCookieStore({ theme });
    expect(() =>
      (store.serialize as (name: string, value: string) => string)("unknown", "x")
    ).toThrow("Unknown cookie");
  });

  test("get with adapter applies remove when onMismatch is remove", () => {
    const schema = {
      "~standard": {
        validate: (v: unknown) =>
          v === "valid" ? { value: v } : { issues: [{ message: "Invalid" }] },
      },
    };
    const cookie = defineCookie("x", { schema, default: "d", onMismatch: "remove" });
    const writeCalls: string[] = [];
    const adapter = {
      read: () => "x=invalid",
      write: (n: string, v: string) => writeCalls.push(`${n}=${v}`),
    };
    const store = createCookieStore({ cookie }, { adapter });
    const got = store.get?.();
    expect(got.cookie).toBe("d");
    expect(writeCalls).toContain("x=");
  });

  test("async schema validation falls back to default", () => {
    const schema = {
      "~standard": {
        validate: (_v: unknown) => Promise.resolve({ value: "async" }),
      },
    };
    const cookie = defineCookie("x", { schema, default: "d" });
    // async validation is treated as failure → uses default
    expect(cookie.parse("somevalue")).toBe("d");
  });

  test("get with pruneUntracked deletes untracked cookies", () => {
    const theme = defineCookie("theme", (v) => v ?? "light");
    const writeCalls: { name: string; value: string }[] = [];
    const adapter = {
      read: () => "theme=dark; untracked=foo",
      write: (n: string, v: string) => writeCalls.push({ name: n, value: v }),
    };
    const store = createCookieStore({ theme }, { adapter, pruneUntracked: { path: "/" } });
    const got = store.get?.();
    expect(got.theme).toBe("dark");
    expect(writeCalls.some((c) => c.name === "untracked" && c.value === "")).toBe(true);
  });
});
