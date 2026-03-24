/**
 * @justwant/notify — createNotify
 * Registry of templates and canals, send = template + canal + args. Optional repo for persistence.
 */

import {
  CanalNotFoundError,
  TemplateNotFoundError,
  TemplateVersionNotFoundError,
} from "./errors.js";
import type {
  Canal,
  ChannelMessage,
  CreateNotifyOptions,
  NotifyInstance,
  NotifyPlugin,
  OnError,
  SendOptions,
  Template,
  TemplateVersions,
} from "./types.js";

const DEFAULT_ON_ERROR: OnError = "throw";

async function notifyPlugins(
  plugins: NotifyPlugin[],
  event: Parameters<NonNullable<NotifyPlugin["onSend"]>>[0]
): Promise<void> {
  for (const plugin of plugins) {
    if (plugin.onSend) await plugin.onSend(event);
  }
}

export function createNotify(options: CreateNotifyOptions): NotifyInstance {
  const {
    templates: initialTemplates,
    canals,
    repo,
    plugins = [],
    onError = DEFAULT_ON_ERROR,
  } = options;

  const registry = new Map<string, Template>(initialTemplates.map((t) => [t.id, t]));

  async function send<TArgs>(opts: SendOptions<TArgs>): Promise<void> {
    const { templateId, canalId, args } = opts;
    const canal = canals[canalId];
    if (!canal) {
      if (onError === "throw") throw new CanalNotFoundError(canalId);
      return;
    }

    const template = registry.get(templateId);
    if (!template) {
      if (onError === "throw") throw new TemplateNotFoundError(templateId);
      return;
    }

    const kind = canal.kind;
    const version = template.versions[kind];
    if (!version) {
      if (onError === "throw") {
        throw new TemplateVersionNotFoundError(templateId, canalId, kind);
      }
      return;
    }

    const message = (version as (a: unknown) => ChannelMessage)(args);

    await notifyPlugins(plugins, { templateId, canalId, args, message, phase: "before" });

    let sendResult: unknown;
    try {
      await (canal as { send(msg: ChannelMessage): Promise<void> }).send(message);
    } catch (err) {
      sendResult = err;
      if (onError === "throw") throw err;
    } finally {
      await notifyPlugins(plugins, { templateId, canalId, args, message, phase: "after", result: sendResult });
    }
  }

  const instance: NotifyInstance = {
    send,
  };

  if (repo) {
    instance.listTemplates = async (): Promise<Template[]> => repo.listTemplates();

    instance.getTemplate = async (opts: { id: string }) => repo.getTemplate(opts);

    instance.createTemplate = async (template: Template): Promise<void> => {
      await repo.createTemplate(template);
      registry.set(template.id, template);
    };

    instance.updateTemplate = async (opts: {
      id: string;
      versions: TemplateVersions;
    }): Promise<void> => {
      await repo.updateTemplate(opts);
      const existing = registry.get(opts.id);
      if (existing) {
        registry.set(opts.id, { ...existing, versions: opts.versions });
      }
    };

    instance.deleteTemplate = async (opts: { id: string }): Promise<void> => {
      await repo.deleteTemplate(opts);
      registry.delete(opts.id);
    };
  }

  for (const plugin of plugins) {
    if (plugin.init) {
      plugin.init({});
    }
  }

  return instance;
}
