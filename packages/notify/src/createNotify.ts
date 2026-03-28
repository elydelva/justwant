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
  OnError,
  SendOptions,
  Template,
  TemplateVersions,
} from "./types.js";

const DEFAULT_ON_ERROR: OnError = "throw";

function requireCanal(
  canals: Record<string, Canal | undefined>,
  canalId: string,
  onError: OnError
): Canal | null {
  const canal = canals[canalId];
  if (!canal) {
    if (onError === "throw") throw new CanalNotFoundError(canalId);
    return null;
  }
  return canal;
}

function requireTemplateVersion(
  registry: Map<string, Template>,
  templateId: string,
  canalId: string,
  kind: Canal["kind"],
  onError: OnError
): ((a: unknown) => ChannelMessage) | null {
  const template = registry.get(templateId);
  if (!template) {
    if (onError === "throw") throw new TemplateNotFoundError(templateId);
    return null;
  }
  const version = template.versions[kind];
  if (!version) {
    if (onError === "throw") throw new TemplateVersionNotFoundError(templateId, canalId, kind);
    return null;
  }
  return version as (a: unknown) => ChannelMessage;
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
    const canal = requireCanal(canals, canalId, onError);
    if (!canal) return;
    const versionFn = requireTemplateVersion(registry, templateId, canalId, canal.kind, onError);
    if (!versionFn) return;

    const message = versionFn(args);

    for (const plugin of plugins) {
      if (plugin.onSend) {
        await plugin.onSend({
          templateId,
          canalId,
          args,
          message,
          phase: "before",
        });
      }
    }

    let sendResult: unknown;
    try {
      await (canal as { send(msg: ChannelMessage): Promise<void> }).send(message);
      sendResult = undefined;
    } catch (err) {
      sendResult = err;
      if (onError === "throw") throw err;
    } finally {
      for (const plugin of plugins) {
        if (plugin.onSend) {
          await plugin.onSend({
            templateId,
            canalId,
            args,
            message,
            phase: "after",
            result: sendResult,
          });
        }
      }
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
