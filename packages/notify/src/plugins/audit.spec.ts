import { describe, expect, test } from "bun:test";
import { createCanal } from "../createCanal.js";
import { createNotify } from "../createNotify.js";
import { createTemplate } from "../createTemplate.js";
import { auditPlugin } from "./audit.js";

describe("auditPlugin", () => {
  test("onSend is called with templateId, canalId, args, message before and after send", async () => {
    const calls: unknown[] = [];
    const plugin = auditPlugin({
      onSend: (opts) => {
        calls.push({ ...opts });
      },
    });
    const { sent, canal } = (() => {
      const s: unknown[] = [];
      return {
        sent: s,
        canal: createCanal({
          kind: "console",
          adapter: { send: async (msg: unknown) => s.push(msg) },
        }),
      };
    })();
    const t = createTemplate({
      id: "audit-test",
      console: (args: { x: number }) => ({ level: "info", text: `n=${args.x}` }),
    });
    const notify = createNotify({
      templates: [t],
      canals: { c: canal },
      plugins: [plugin],
    });
    await notify.send({
      templateId: "audit-test",
      canalId: "c",
      args: { x: 42 },
    });
    expect(calls).toHaveLength(2);
    expect((calls[0] as { phase: string }).phase).toBe("before");
    expect((calls[0] as { templateId: string }).templateId).toBe("audit-test");
    expect((calls[0] as { canalId: string }).canalId).toBe("c");
    expect((calls[0] as { args: { x: number } }).args).toEqual({ x: 42 });
    expect((calls[0] as { message: { text: string } }).message).toEqual({
      level: "info",
      text: "n=42",
    });
    expect((calls[1] as { phase: string }).phase).toBe("after");
    expect((calls[1] as { result: unknown }).result).toBeUndefined();
  });

  test("onSend after is called with result when send throws (onError throw)", async () => {
    const afterCalls: unknown[] = [];
    const plugin = auditPlugin({
      onSend: (opts) => {
        if (opts.phase === "after") afterCalls.push(opts);
      },
    });
    const canal = createCanal({
      kind: "console",
      adapter: {
        send: async () => {
          throw new Error("send failed");
        },
      },
    });
    const t = createTemplate({
      id: "fail",
      console: () => ({ level: "info", text: "x" }),
    });
    const notify = createNotify({
      templates: [t],
      canals: { c: canal },
      plugins: [plugin],
    });
    await expect(notify.send({ templateId: "fail", canalId: "c", args: {} })).rejects.toThrow(
      "send failed"
    );
    expect(afterCalls).toHaveLength(1);
    expect((afterCalls[0] as { result: Error }).result).toBeInstanceOf(Error);
    expect((afterCalls[0] as { result: Error }).result?.message).toBe("send failed");
  });
});
