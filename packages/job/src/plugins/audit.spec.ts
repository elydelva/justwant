import { describe, expect, test } from "bun:test";
import { auditPlugin } from "./audit.js";
import type { AuditEntry } from "./audit.js";

function makeCtx(payload: unknown = { id: 1 }) {
  return { jobId: "test-job", payload };
}

describe("auditPlugin", () => {
  test("logs a success entry after next resolves", async () => {
    const entries: AuditEntry[] = [];
    const plugin = auditPlugin({
      audit: {
        log: (e) => {
          entries.push(e);
        },
      },
    });

    await plugin.beforeExecute?.(makeCtx(), async () => {});

    expect(entries).toHaveLength(1);
    expect(entries[0]?.status).toBe("success");
    expect(entries[0]?.jobId).toBe("test-job");
    expect(entries[0]?.durationMs).toBeGreaterThanOrEqual(0);
    expect(entries[0]?.payloadHash).toBeTruthy();
  });

  test("logs a failure entry and re-throws when next throws", async () => {
    const entries: AuditEntry[] = [];
    const plugin = auditPlugin({
      audit: {
        log: (e) => {
          entries.push(e);
        },
      },
    });

    await expect(
      plugin.beforeExecute?.(makeCtx(), async () => {
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");

    expect(entries).toHaveLength(1);
    expect(entries[0]?.status).toBe("failure");
  });

  test("payloadHash is consistent for same payload", async () => {
    const hashes: string[] = [];
    const plugin = auditPlugin({
      audit: {
        log: (e) => {
          if (e.payloadHash) hashes.push(e.payloadHash);
        },
      },
    });

    await plugin.beforeExecute?.(makeCtx({ key: "value" }), async () => {});
    await plugin.beforeExecute?.(makeCtx({ key: "value" }), async () => {});

    expect(hashes[0]).toBe(hashes[1]);
  });

  test("payloadHash handles non-serializable payload gracefully", async () => {
    const entries: AuditEntry[] = [];
    const plugin = auditPlugin({
      audit: {
        log: (e) => {
          entries.push(e);
        },
      },
    });
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    await plugin.beforeExecute?.(makeCtx(circular), async () => {});
    expect(entries[0]?.payloadHash).toBe("?");
  });

  test("audit.log is awaited (async log)", async () => {
    let logged = false;
    const plugin = auditPlugin({
      audit: {
        log: async () => {
          await Promise.resolve();
          logged = true;
        },
      },
    });

    await plugin.beforeExecute?.(makeCtx(), async () => {});
    expect(logged).toBe(true);
  });
});
