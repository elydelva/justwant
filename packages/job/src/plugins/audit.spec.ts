import { describe, expect, mock, test } from "bun:test";
import { auditPlugin } from "./audit.js";

function makeCtx(jobId = "job-1", payload: unknown = { foo: "bar" }) {
  return { jobId, payload };
}

describe("auditPlugin (job)", () => {
  test("logs success entry after next() resolves", async () => {
    const logFn = mock();
    const plugin = auditPlugin({ audit: { log: logFn } });
    const ctx = makeCtx();
    await plugin.beforeExecute!(ctx as never, async () => {});
    expect(logFn).toHaveBeenCalledTimes(1);
    const entry = logFn.mock.calls[0][0];
    expect(entry.jobId).toBe("job-1");
    expect(entry.status).toBe("success");
    expect(typeof entry.durationMs).toBe("number");
    expect(entry.startedAt).toBeInstanceOf(Date);
    expect(typeof entry.payloadHash).toBe("string");
  });

  test("logs failure entry and rethrows when next() throws", async () => {
    const logFn = mock();
    const plugin = auditPlugin({ audit: { log: logFn } });
    const ctx = makeCtx("job-2");
    await expect(
      plugin.beforeExecute!(ctx as never, async () => {
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");
    expect(logFn).toHaveBeenCalledTimes(1);
    const entry = logFn.mock.calls[0][0];
    expect(entry.status).toBe("failure");
  });

  test("payloadHash is consistent for same payload", async () => {
    const entries: import("./audit.js").AuditEntry[] = [];
    const plugin = auditPlugin({ audit: { log: (e) => { entries.push(e); } } });
    const ctx = makeCtx("j", { x: 1 });
    await plugin.beforeExecute!(ctx as never, async () => {});
    await plugin.beforeExecute!(ctx as never, async () => {});
    expect(entries[0]?.payloadHash).toBe(entries[1]?.payloadHash);
  });

  test("payloadHash differs for different payloads", async () => {
    const entries: import("./audit.js").AuditEntry[] = [];
    const plugin = auditPlugin({ audit: { log: (e) => { entries.push(e); } } });
    await plugin.beforeExecute!(makeCtx("j", { x: 1 }) as never, async () => {});
    await plugin.beforeExecute!(makeCtx("j", { x: 2 }) as never, async () => {});
    expect(entries[0]?.payloadHash).not.toBe(entries[1]?.payloadHash);
  });
});
