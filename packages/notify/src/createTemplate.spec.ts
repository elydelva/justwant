import { describe, expect, test } from "bun:test";
import { createTemplate } from "./createTemplate.js";

describe("createTemplate", () => {
  test("returns template with id and versions from options", () => {
    const t = createTemplate({
      id: "welcome",
      email: (args: { to: string }) => ({
        to: args.to,
        subject: "Hi",
        html: "<p>Hi</p>",
      }),
      sms: (args: { to: string }) => ({ to: args.to, body: "Hi" }),
    });
    expect(t.id).toBe("welcome");
    expect(t.versions.email).toBeDefined();
    expect(t.versions.sms).toBeDefined();
    expect(t.versions.console).toBeUndefined();
  });

  test("version factories produce correct message types", () => {
    const t = createTemplate<{ to: string; name: string }>({
      id: "test",
      email: (args) => ({
        to: args.to,
        subject: "Hello",
        html: `Hello ${args.name}`,
      }),
      console: (args) => ({
        level: "info",
        text: `Email to ${args.to}`,
      }),
    });
    const emailMsg = t.versions.email?.({ to: "a@b.com", name: "Alice" });
    expect(emailMsg).toBeDefined();
    expect(emailMsg).toEqual({
      to: "a@b.com",
      subject: "Hello",
      html: "Hello Alice",
    });
    const consoleMsg = t.versions.console?.({ to: "a@b.com", name: "Alice" });
    expect(consoleMsg).toBeDefined();
    expect(consoleMsg).toEqual({ level: "info", text: "Email to a@b.com" });
  });

  test("template with only one channel has single version", () => {
    const t = createTemplate({
      id: "single",
      sms: (args: { to: string }) => ({ to: args.to, body: "OK" }),
    });
    expect(t.versions.sms).toBeDefined();
    expect(t.versions.email).toBeUndefined();
    expect(Object.keys(t.versions)).toEqual(["sms"]);
  });
});
