import { describe, expect, test } from "bun:test";
import { createCanal } from "./createCanal.js";
import { createNotify } from "./createNotify.js";
import { createTemplate } from "./createTemplate.js";
import {
  CanalNotFoundError,
  TemplateNotFoundError,
  TemplateVersionNotFoundError,
} from "./errors.js";
import { createMemoryNotifyRepository } from "./repo/memory.js";

function mockCanal(kind: "email" | "sms" | "console") {
  const sent: unknown[] = [];
  return {
    sent,
    canal: createCanal({
      kind,
      adapter: {
        send: async (msg: unknown) => {
          sent.push(msg);
        },
      },
    }),
  };
}

describe("createNotify", () => {
  test("send delivers to canal when template has version for that canal", async () => {
    const { sent, canal } = mockCanal("email");
    const welcome = createTemplate<{ to: string; name: string }>({
      id: "welcome",
      email: (args) => ({
        to: args.to,
        subject: "Welcome",
        html: `<p>Hi ${args.name}</p>`,
      }),
    });
    const notify = createNotify({
      templates: [welcome],
      canals: { "email:default": canal },
    });
    await notify.send({
      templateId: "welcome",
      canalId: "email:default",
      args: { to: "a@b.com", name: "Alice" },
    });
    expect(sent).toHaveLength(1);
    expect((sent[0] as { to: string }).to).toBe("a@b.com");
    expect((sent[0] as { subject: string }).subject).toBe("Welcome");
  });

  test("send throws when template has no version for canal", async () => {
    const { canal } = mockCanal("sms");
    const welcome = createTemplate({
      id: "welcome",
      email: () => ({ to: "", subject: "", html: "" }),
    });
    const notify = createNotify({
      templates: [welcome],
      canals: { "sms:twilio": canal },
    });
    await expect(
      notify.send({
        templateId: "welcome",
        canalId: "sms:twilio",
        args: {},
      })
    ).rejects.toThrow(TemplateVersionNotFoundError);
  });

  test("send throws when canal is unknown", async () => {
    const welcome = createTemplate({
      id: "welcome",
      console: () => ({ level: "info", text: "x" }),
    });
    const notify = createNotify({
      templates: [welcome],
      canals: {},
    });
    await expect(
      notify.send({
        templateId: "welcome",
        canalId: "nope",
        args: {},
      })
    ).rejects.toThrow(CanalNotFoundError);
  });

  test("send throws when template is unknown", async () => {
    const { canal } = mockCanal("console");
    const notify = createNotify({
      templates: [],
      canals: { console: canal },
    });
    await expect(
      notify.send({
        templateId: "missing",
        canalId: "console",
        args: {},
      })
    ).rejects.toThrow(TemplateNotFoundError);
  });

  test("onError silent does not throw on unknown canal", async () => {
    const notify = createNotify({
      templates: [],
      canals: {},
      onError: "silent",
    });
    await expect(
      notify.send({
        templateId: "x",
        canalId: "y",
        args: {},
      })
    ).resolves.toBeUndefined();
  });

  test("onError silent does not throw when template has no version for canal", async () => {
    const { canal } = mockCanal("sms");
    const t = createTemplate({
      id: "t",
      email: () => ({ to: "", subject: "", html: "" }),
    });
    const notify = createNotify({
      templates: [t],
      canals: { sms: canal },
      onError: "silent",
    });
    await expect(
      notify.send({ templateId: "t", canalId: "sms", args: {} })
    ).resolves.toBeUndefined();
  });

  test("without repo, listTemplates / getTemplate are undefined", () => {
    const notify = createNotify({
      templates: [],
      canals: {},
    });
    expect(notify.listTemplates).toBeUndefined();
    expect(notify.getTemplate).toBeUndefined();
    expect(notify.createTemplate).toBeUndefined();
    expect(notify.updateTemplate).toBeUndefined();
    expect(notify.deleteTemplate).toBeUndefined();
  });

  test("with repo, listTemplates and getTemplate delegate to repo", async () => {
    const repo = createMemoryNotifyRepository();
    const t = createTemplate({ id: "x", console: () => ({ level: "info", text: "x" }) });
    await repo.createTemplate(t);
    const notify = createNotify({
      templates: [],
      canals: {},
      repo,
    });
    const list = await notify.listTemplates?.();
    expect(list).toHaveLength(1);
    expect(list?.[0].id).toBe("x");
    const got = await notify.getTemplate?.({ id: "x" });
    expect(got?.id).toBe("x");
  });

  test("with repo, createTemplate persists and updates registry", async () => {
    const repo = createMemoryNotifyRepository();
    const { canal } = mockCanal("console");
    const notify = createNotify({
      templates: [],
      canals: { c: canal },
      repo,
    });
    const t = createTemplate({
      id: "new",
      console: () => ({ level: "info", text: "new" }),
    });
    await notify.createTemplate?.(t);
    const list = await notify.listTemplates?.();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("new");
    await notify.send({ templateId: "new", canalId: "c", args: {} });
    expect((await repo.getTemplate({ id: "new" }))?.id).toBe("new");
  });

  test("with repo, updateTemplate and deleteTemplate delegate to repo", async () => {
    const repo = createMemoryNotifyRepository();
    const t = createTemplate({
      id: "u",
      console: () => ({ level: "info", text: "old" }),
    });
    await repo.createTemplate(t);
    const notify = createNotify({
      templates: [t],
      canals: {},
      repo,
    });
    await notify.updateTemplate?.({
      id: "u",
      versions: {
        console: () => ({ level: "info", text: "updated" }),
      },
    });
    const got = await repo.getTemplate({ id: "u" });
    expect(got?.versions.console?.({})).toEqual({ level: "info", text: "updated" });
    await notify.deleteTemplate?.({ id: "u" });
    expect(await repo.getTemplate({ id: "u" })).toBeNull();
  });
});
