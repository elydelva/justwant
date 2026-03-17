import { describe, expect, test } from "bun:test";
import {
  createCanal,
  createConsoleCanal,
  createEmailCanal,
  createSmsCanal,
} from "./createCanal.js";

describe("createCanal", () => {
  test("creates canal for kind and adapter and send calls adapter", async () => {
    const sent: { to: string; body: string }[] = [];
    const canal = createCanal({
      kind: "sms",
      adapter: {
        send: async (msg) => {
          sent.push(msg);
        },
      },
    });
    expect(canal.kind).toBe("sms");
    await canal.send({ to: "+33600000000", body: "Hello" });
    expect(sent).toEqual([{ to: "+33600000000", body: "Hello" }]);
  });

  test("creates email canal and send forwards to adapter", async () => {
    const sent: unknown[] = [];
    const canal = createCanal({
      kind: "email",
      adapter: {
        send: async (msg) => {
          sent.push(msg);
        },
      },
    });
    expect(canal.kind).toBe("email");
    await canal.send({
      to: "a@b.com",
      subject: "Test",
      html: "<p>Test</p>",
    });
    expect(sent).toHaveLength(1);
    expect((sent[0] as { to: string; subject: string }).to).toBe("a@b.com");
    expect((sent[0] as { subject: string }).subject).toBe("Test");
  });

  test("creates console canal", async () => {
    const canal = createCanal({
      kind: "console",
      adapter: {
        send: async (msg) => {
          expect(msg.level).toBe("info");
          expect(msg.text).toContain("hello");
        },
      },
    });
    expect(canal.kind).toBe("console");
    await canal.send({ level: "info", text: "hello" });
  });

  test("createEmailCanal returns EmailCanal", async () => {
    const sent: unknown[] = [];
    const canal = createEmailCanal({
      kind: "email",
      adapter: { send: async (m) => sent.push(m) },
    });
    expect(canal.kind).toBe("email");
    await canal.send({ to: "a@b.com", subject: "S", html: "<p>H</p>" });
    expect(sent).toHaveLength(1);
  });

  test("createSmsCanal returns SmsCanal", async () => {
    const sent: unknown[] = [];
    const canal = createSmsCanal({
      kind: "sms",
      adapter: { send: async (m) => sent.push(m) },
    });
    expect(canal.kind).toBe("sms");
    await canal.send({ to: "+336", body: "Hi" });
    expect(sent).toHaveLength(1);
  });

  test("createConsoleCanal returns ConsoleCanal", async () => {
    const sent: unknown[] = [];
    const canal = createConsoleCanal({
      kind: "console",
      adapter: { send: async (m) => sent.push(m) },
    });
    expect(canal.kind).toBe("console");
    await canal.send({ level: "debug", text: "msg" });
    expect(sent).toHaveLength(1);
  });
});
