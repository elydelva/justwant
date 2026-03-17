import { describe, expect, test } from "bun:test";
import { auditPlugin } from "./audit.js";

describe("auditPlugin", () => {
  test("returns plugin with beforeExecute defined", () => {
    const plugin = auditPlugin({
      audit: { log: async () => {} },
    });
    expect(plugin.beforeExecute).toBeDefined();
    expect(typeof plugin.beforeExecute).toBe("function");
  });

  test("beforeExecute calls audit.log with operation, listKey, actorKey", async () => {
    const logs: Array<{ operation: string; listKey: string; actorKey?: string }> = [];
    const plugin = auditPlugin({
      audit: {
        log: (entry) => {
          logs.push(entry);
        },
      },
    });
    const next = async () => "result";
    await plugin.beforeExecute?.(
      {
        operation: "subscribe",
        listKey: "beta",
        actor: { type: "user", id: "u1" },
      },
      next
    );
    expect(logs).toHaveLength(1);
    expect(logs[0]?.operation).toBe("subscribe");
    expect(logs[0]?.listKey).toBe("beta");
    expect(logs[0]?.actorKey).toBe("user:u1");
  });
});
