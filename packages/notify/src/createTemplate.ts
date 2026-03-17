/**
 * @justwant/notify — createTemplate
 * Template = id + canal versions (factories) in one call.
 */

import type {
  ChannelKind,
  ChannelMessage,
  ConsoleMessage,
  EmailMessage,
  SlackMessage,
  SmsMessage,
  Template,
  TemplateVersions,
  WebhookMessage,
} from "./types.js";

export interface CreateTemplateOptions<TArgs = Record<string, unknown>> {
  id: string;
  email?: (args: TArgs) => EmailMessage;
  sms?: (args: TArgs) => SmsMessage;
  console?: (args: TArgs) => ConsoleMessage;
  webhook?: (args: TArgs) => WebhookMessage;
  slack?: (args: TArgs) => SlackMessage;
}

/**
 * Creates a template with one version per channel. Each key (email, sms, etc.) is a
 * factory (args) => Message for that channel.
 */
export function createTemplate<TArgs = Record<string, unknown>>(
  options: CreateTemplateOptions<TArgs>
): Template<TArgs> {
  const { id, ...rest } = options;
  const versions: TemplateVersions<TArgs> = {};
  const keys: ChannelKind[] = ["email", "sms", "console", "webhook", "slack"];
  for (const k of keys) {
    const fn = rest[k as keyof typeof rest];
    if (typeof fn === "function") {
      (versions as Record<string, (args: TArgs) => ChannelMessage>)[k] = fn as (
        args: TArgs
      ) => ChannelMessage;
    }
  }
  return { id, versions };
}
