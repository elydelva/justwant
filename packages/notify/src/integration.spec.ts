import { describe, expect, test } from "bun:test";
import { createCanal } from "./createCanal.js";
import { createNotify } from "./createNotify.js";
import { createTemplate } from "./createTemplate.js";
import { auditPlugin } from "./plugins/audit.js";
import { createMemoryNotifyRepository } from "./repo/memory.js";

describe("integration", () => {
  test("createNotify with multiple templates, canals, repo and audit plugin", async () => {
    const emailSent: unknown[] = [];
    const smsSent: unknown[] = [];
    const auditCalls: { phase: string; templateId: string; canalId: string }[] = [];

    const welcome = createTemplate<{ to: string; userName: string; link: string }>({
      id: "welcome",
      email: (args) => ({
        to: args.to,
        subject: "Bienvenue",
        html: `<p>Bonjour ${args.userName}, <a href="${args.link}">confirmer</a>.</p>`,
      }),
      sms: (args) => ({
        to: args.to,
        body: `Bonjour ${args.userName}, confirmez ici : ${args.link}`,
      }),
    });

    const jobFailed = createTemplate<{ jobId: string; error: string }>({
      id: "job-failed",
      email: (args) => ({
        to: "ops@example.com",
        subject: `Job ${args.jobId} failed`,
        html: `<p>${args.error}</p>`,
      }),
    });

    const emailCanal = createCanal({
      kind: "email",
      adapter: {
        send: async (msg) => emailSent.push(msg),
      },
    });
    const smsCanal = createCanal({
      kind: "sms",
      adapter: {
        send: async (msg) => smsSent.push(msg),
      },
    });

    const repo = createMemoryNotifyRepository();
    const notify = createNotify({
      templates: [welcome, jobFailed],
      canals: {
        "email:default": emailCanal,
        "sms:twilio": smsCanal,
      },
      repo,
      plugins: [
        auditPlugin({
          onSend: (opts) => {
            auditCalls.push({
              phase: opts.phase,
              templateId: opts.templateId,
              canalId: opts.canalId,
            });
          },
        }),
      ],
    });

    await notify.send({
      templateId: "welcome",
      canalId: "email:default",
      args: {
        to: "alice@example.com",
        userName: "Alice",
        link: "https://app.example.com/confirm?token=xxx",
      },
    });
    expect(emailSent).toHaveLength(1);
    expect((emailSent[0] as { to: string }).to).toBe("alice@example.com");
    expect((emailSent[0] as { subject: string }).subject).toBe("Bienvenue");

    await notify.send({
      templateId: "welcome",
      canalId: "sms:twilio",
      args: {
        to: "+33600000000",
        userName: "Alice",
        link: "https://app.example.com/confirm",
      },
    });
    expect(smsSent).toHaveLength(1);
    expect((smsSent[0] as { body: string }).body).toContain("confirmez ici");

    const beforeCalls = auditCalls.filter((c) => c.phase === "before");
    const afterCalls = auditCalls.filter((c) => c.phase === "after");
    expect(beforeCalls).toHaveLength(2);
    expect(afterCalls).toHaveLength(2);

    // listTemplates/getTemplate read from repo; initial templates are only in registry for send()
    const list = await notify.listTemplates?.();
    expect(list).toHaveLength(0);

    const newT = createTemplate({
      id: "dynamic",
      email: () => ({ to: "", subject: "", html: "" }),
    });
    await notify.createTemplate?.(newT);
    const listAfter = await notify.listTemplates?.();
    expect(listAfter).toHaveLength(1);
    expect(listAfter?.[0].id).toBe("dynamic");
    const got = await notify.getTemplate?.({ id: "dynamic" });
    expect(got).not.toBeNull();
    expect(got?.id).toBe("dynamic");

    await notify.send({
      templateId: "job-failed",
      canalId: "email:default",
      args: { jobId: "daily-invoice", error: "Connection timeout" },
    });
    expect(emailSent).toHaveLength(2);
    expect((emailSent[1] as { subject: string }).subject).toContain("daily-invoice");
  });
});
