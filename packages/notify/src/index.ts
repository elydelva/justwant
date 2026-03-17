/**
 * @justwant/notify — Notifications via templates and channels
 */

export { createNotify } from "./createNotify.js";
export { createTemplate } from "./createTemplate.js";
export type { CreateTemplateOptions } from "./createTemplate.js";
export {
  createCanal,
  createEmailCanal,
  createSmsCanal,
  createConsoleCanal,
} from "./createCanal.js";
export {
  TemplateNotFoundError,
  CanalNotFoundError,
  TemplateVersionNotFoundError,
  NotifyError,
} from "./errors.js";
export { createAlertNotifier } from "./createAlertNotifier.js";
export type { AlertPayload, CreateAlertNotifierOptions } from "./createAlertNotifier.js";
export type {
  ChannelKind,
  ChannelMessage,
  EmailMessage,
  SmsMessage,
  ConsoleMessage,
  WebhookMessage,
  SlackMessage,
  MessageForKind,
  Template,
  TemplateVersions,
  Canal,
  EmailCanal,
  SmsCanal,
  ConsoleCanal,
  WebhookCanal,
  SlackCanal,
  SendOptions,
  NotifyInstance,
  NotifyRepository,
  NotifyPlugin,
  NotifyPluginContext,
  CreateNotifyOptions,
  CreateCanalOptions,
  OnError,
} from "./types.js";
