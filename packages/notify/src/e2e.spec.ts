/**
 * E2E: real createNotify + real console canal (no mocks, no external APIs).
 * Uses a capture adapter that records messages so we can assert without patching global console.
 */

import { describe, expect, test } from "bun:test";
import { createCanal } from "./createCanal.js";
import { createNotify } from "./createNotify.js";
import { createTemplate } from "./createTemplate.js";
import type { ConsoleMessage } from "./types.js";

function createCaptureConsoleAdapter(): {
  sent: ConsoleMessage[];
  adapter: { send(message: ConsoleMessage): Promise<void> };
} {
  const sent: ConsoleMessage[] = [];
  return {
    sent,
    adapter: {
      async send(message: ConsoleMessage) {
        sent.push(message);
      },
    },
  };
}

describe("e2e", () => {
  test("send delivers to real console canal and message is received", async () => {
    const { sent, adapter } = createCaptureConsoleAdapter();
    const welcome = createTemplate<{ to: string; name: string }>({
      id: "welcome",
      console: (args) => ({
        level: "info",
        text: `Welcome ${args.name} to ${args.to}`,
      }),
    });

    const notify = createNotify({
      templates: [welcome],
      canals: { dev: createCanal({ kind: "console", adapter }) },
    });

    await notify.send({
      templateId: "welcome",
      canalId: "dev",
      args: { to: "alice@example.com", name: "Alice" },
    });

    expect(sent).toHaveLength(1);
    expect(sent[0].level).toBe("info");
    expect(sent[0].text).toContain("Welcome Alice");
    expect(sent[0].text).toContain("alice@example.com");
  });

  test("multi-canal template sends to console when console version exists", async () => {
    const { sent, adapter } = createCaptureConsoleAdapter();
    const t = createTemplate<{ id: string }>({
      id: "multi",
      email: (args) => ({ to: "x@y.com", subject: "Hi", html: `<p>${args.id}</p>` }),
      console: (args) => ({ level: "info", text: `Multi ${args.id}` }),
    });

    const notify = createNotify({
      templates: [t],
      canals: { c: createCanal({ kind: "console", adapter }) },
    });

    await notify.send({ templateId: "multi", canalId: "c", args: { id: "e2e" } });

    expect(sent).toHaveLength(1);
    expect(sent[0].text).toBe("Multi e2e");
  });

  test("real consoleCanal can be used and logs to console", async () => {
    const { consoleCanal } = await import("./channels/console.js");
    const welcome = createTemplate<{ name: string }>({
      id: "welcome",
      console: (args) => ({ level: "info", text: `Hello ${args.name}` }),
    });
    const notify = createNotify({
      templates: [welcome],
      canals: { dev: consoleCanal() },
    });
    await expect(
      notify.send({ templateId: "welcome", canalId: "dev", args: { name: "E2E" } })
    ).resolves.toBeUndefined();
  });
});
