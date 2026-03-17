/**
 * @justwant/notify — Core types
 * Template = id + one version per channel. Send = template + canal + args.
 */

/** Supported channel kinds. */
export type ChannelKind = "email" | "sms" | "console" | "webhook" | "slack";

// --- Message types per channel ---

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{ filename: string; content: string | Buffer }>;
}

export interface SmsMessage {
  to: string;
  body: string;
}

export interface ConsoleMessage {
  level: "info" | "warn" | "error" | "debug";
  text: string;
}

export interface WebhookMessage {
  url: string;
  body: unknown;
  headers?: Record<string, string>;
}

export interface SlackMessage {
  text: string;
  blocks?: unknown[];
  attachments?: unknown[];
}

export type ChannelMessage =
  | EmailMessage
  | SmsMessage
  | ConsoleMessage
  | WebhookMessage
  | SlackMessage;

/** Map channel kind to its message type. */
export type MessageForKind<K extends ChannelKind> = K extends "email"
  ? EmailMessage
  : K extends "sms"
    ? SmsMessage
    : K extends "console"
      ? ConsoleMessage
      : K extends "webhook"
        ? WebhookMessage
        : K extends "slack"
          ? SlackMessage
          : never;

// --- Template ---

/** Canal version factories: one per channel kind. */
export type TemplateVersions<TArgs = Record<string, unknown>> = Partial<
  Record<ChannelKind, (args: TArgs) => ChannelMessage>
>;

/** Template: id + one version (factory) per channel. */
export interface Template<TArgs = Record<string, unknown>> {
  readonly id: string;
  readonly versions: TemplateVersions<TArgs>;
}

// --- Canal (per kind) ---

export interface EmailCanal {
  kind: "email";
  send(message: EmailMessage): Promise<void>;
}

export interface SmsCanal {
  kind: "sms";
  send(message: SmsMessage): Promise<void>;
}

export interface ConsoleCanal {
  kind: "console";
  send(message: ConsoleMessage): Promise<void>;
}

export interface WebhookCanal {
  kind: "webhook";
  send(message: WebhookMessage): Promise<void>;
}

export interface SlackCanal {
  kind: "slack";
  send(message: SlackMessage): Promise<void>;
}

export type Canal = EmailCanal | SmsCanal | ConsoleCanal | WebhookCanal | SlackCanal;

// --- Send options ---

export interface SendOptions<TArgs = Record<string, unknown>> {
  templateId: string;
  canalId: string;
  args: TArgs;
}

// --- Notify instance ---

export type OnError = "throw" | "silent";

export interface NotifyInstance {
  send<TArgs = Record<string, unknown>>(options: SendOptions<TArgs>): Promise<void>;

  listTemplates?(): Promise<Template[]>;
  getTemplate?(options: { id: string }): Promise<Template | null>;
  createTemplate?(template: Template): Promise<void>;
  updateTemplate?(options: {
    id: string;
    versions: TemplateVersions;
  }): Promise<void>;
  deleteTemplate?(options: { id: string }): Promise<void>;
}

// --- Repository ---

export interface NotifyRepository {
  listTemplates(): Promise<Template[]>;
  getTemplate(options: { id: string }): Promise<Template | null>;
  createTemplate(template: Template): Promise<void>;
  updateTemplate(options: { id: string; versions: TemplateVersions }): Promise<void>;
  deleteTemplate(options: { id: string }): Promise<void>;
}

// --- CreateNotify options ---

export interface NotifyPluginContext {
  /** Optional: set context for downstream. */
  setContext?(key: string, value: unknown): void;
}

export interface NotifyPlugin {
  init?(context: NotifyPluginContext): void;
  /** Called after message is built: phase 'before' then canal.send, then phase 'after' with result. */
  onSend?(options: {
    templateId: string;
    canalId: string;
    args: unknown;
    message: ChannelMessage;
    phase: "before" | "after";
    result?: unknown;
  }): void | Promise<void>;
}

export interface CreateNotifyOptions {
  templates: Template[];
  canals: Record<string, Canal>;
  repo?: NotifyRepository;
  plugins?: NotifyPlugin[];
  onError?: OnError;
}

// --- CreateCanal options ---

export interface CreateCanalOptions<K extends ChannelKind> {
  kind: K;
  adapter: { send(message: MessageForKind<K>): Promise<void> };
}
