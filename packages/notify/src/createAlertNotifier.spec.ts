import { describe, expect, test } from "bun:test";
import { createAlertNotifier } from "./createAlertNotifier.js";
import { createCanal } from "./createCanal.js";
import { createNotify } from "./createNotify.js";
import { createTemplate } from "./createTemplate.js";

describe("createAlertNotifier", () => {
  test("returns a function that sends payload via notify with given templateId and canalId", async () => {
    const sent: unknown[] = [];
    const canal = createCanal({
      kind: "console",
      adapter: {
        send: async (msg) => sent.push(msg),
      },
    });
    const jobFailed = createTemplate<{ jobId: string; error: unknown; runCount?: number }>({
      id: "job-failed",
      console: (args) => ({
        level: "error",
        text: `Job ${args.jobId} failed: ${args.error}`,
      }),
    });
    const notify = createNotify({
      templates: [jobFailed],
      canals: { alert: canal },
    });
    const notifier = createAlertNotifier(notify, {
      templateId: "job-failed",
      canalId: "alert",
    });
    await notifier({
      jobId: "daily-invoice",
      error: new Error("Connection timeout"),
      runCount: 3,
    });
    expect(sent).toHaveLength(1);
    expect((sent[0] as { level: string; text: string }).level).toBe("error");
    expect((sent[0] as { text: string }).text).toContain("daily-invoice");
    expect((sent[0] as { text: string }).text).toContain("Connection timeout");
  });
});
