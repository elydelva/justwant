import { describe, expect, test } from "bun:test";
import { DocumentAdapter } from "./adapters/document.js";
import { ExpressAdapter } from "./adapters/express.js";
import { HeaderAdapter } from "./adapters/header.js";
import { NextJSAdapter } from "./adapters/nextjs.js";
import { RequestResponseAdapter } from "./adapters/request-response.js";
import { createCookieStore, defineCookie } from "./typed.js";

describe("DocumentAdapter", () => {
  test("read returns document.cookie when document provided", () => {
    const doc = { cookie: "a=1; b=2" };
    const adapter = DocumentAdapter(doc);
    expect(adapter.read()).toBe("a=1; b=2");
  });

  test("write assigns to document.cookie", () => {
    let cookie = "";
    const doc = {
      get cookie() {
        return cookie;
      },
      set cookie(v: string) {
        cookie = v;
      },
    };
    const adapter = DocumentAdapter(doc as { cookie: string });
    adapter.write("x", "y", { path: "/" });
    expect(cookie).toContain("x=y");
  });
});

describe("HeaderAdapter", () => {
  test("read returns getCookie result", () => {
    let cookieHeader = "a=1; b=2";
    const adapter = HeaderAdapter({
      getCookie: () => cookieHeader,
      appendSetCookie: (v) => {
        cookieHeader = v;
      },
    });
    expect(adapter.read()).toBe("a=1; b=2");
  });

  test("write appends Set-Cookie via appendSetCookie", () => {
    const set: string[] = [];
    const adapter = HeaderAdapter({
      getCookie: () => "",
      appendSetCookie: (v) => set.push(v),
    });
    adapter.write("session", "abc", { path: "/" });
    expect(set[0]).toContain("session=abc");
    expect(set[0]).toContain("Path=/");
  });
});

describe("RequestResponseAdapter", () => {
  test("read from request Cookie header", () => {
    const request = new Request("https://x.com", {
      headers: { Cookie: "theme=dark" },
    });
    const response = new Response();
    const adapter = RequestResponseAdapter(request, response);
    expect(adapter.read()).toBe("theme=dark");
  });

  test("write appends to response Set-Cookie", () => {
    const request = new Request("https://x.com");
    const response = new Response();
    const adapter = RequestResponseAdapter(request, response);
    adapter.write("x", "y");
    expect(response.headers.getSetCookie()).toContain("x=y");
  });
});

describe("NextJSAdapter", () => {
  test("read builds string from getAll", () => {
    const mockStore = {
      getAll: () => [
        { name: "theme", value: "dark" },
        { name: "session", value: "abc" },
      ],
      set: () => {},
    };
    const adapter = NextJSAdapter(mockStore);
    expect(adapter.read()).toContain("theme");
    expect(adapter.read()).toContain("dark");
  });

  test("write calls store.set with name, value, options", () => {
    const setCalls: { name: string; value: string; options?: object }[] = [];
    const mockStore = {
      getAll: () => [],
      set: (name: string, value: string, options?: object) =>
        setCalls.push({ name, value, options }),
    };
    const adapter = NextJSAdapter(mockStore);
    adapter.write("theme", "dark", { path: "/", maxAge: 3600 });
    expect(setCalls).toHaveLength(1);
    expect(setCalls[0].name).toBe("theme");
    expect(setCalls[0].value).toBe("dark");
    expect(setCalls[0].options).toEqual({ path: "/", maxAge: 3600 });
  });
});

describe("ExpressAdapter", () => {
  test("read from req.headers.cookie", () => {
    const req = { headers: { cookie: "a=1" } };
    const appendCalls: string[] = [];
    const res = { append: (n: string, v: string) => appendCalls.push(v) };
    const adapter = ExpressAdapter(req, res);
    expect(adapter.read()).toBe("a=1");
  });

  test("write calls res.append Set-Cookie", () => {
    const req = { headers: {} };
    const appendCalls: [string, string][] = [];
    const res = {
      append: (n: string, v: string) => appendCalls.push([n, v]),
    };
    const adapter = ExpressAdapter(req, res);
    adapter.write("x", "y");
    expect(appendCalls[0]).toEqual(["Set-Cookie", "x=y"]);
  });
});

describe("createCookieStore with adapter", () => {
  const theme = defineCookie("theme", (v) => (v === "dark" ? "dark" : "light"));
  const session = defineCookie("session");

  test("get returns parsed cookies from adapter read", () => {
    const adapter = HeaderAdapter({
      getCookie: () => "theme=dark; session=abc",
      appendSetCookie: () => {},
    });
    const store = createCookieStore({ theme, session }, { adapter });
    const got = store.get?.();
    expect(got.theme).toBe("dark");
    expect(got.session).toBe("abc");
  });

  test("set writes to adapter", () => {
    const setCalls: string[] = [];
    const adapter = HeaderAdapter({
      getCookie: () => "",
      appendSetCookie: (v) => setCalls.push(v),
    });
    const store = createCookieStore({ theme, session }, { adapter });
    store.set?.("theme", "dark", { path: "/" });
    expect(setCalls[0]).toContain("theme=dark");
    expect(setCalls[0]).toContain("Path=/");
  });
});
