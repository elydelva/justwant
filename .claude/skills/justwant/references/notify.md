# @justwant/notify

Multi-channel notification system. Separates *what* (templates) from *where* (canals). Send = template + canal + args.

## Install

```bash
bun add @justwant/notify
# Email: bun add resend
# SMS:   bun add twilio
```

## Usage

```ts
import { createNotify, createTemplate, createCanal } from "@justwant/notify";
import { createResendCanal } from "@justwant/notify/channels/email/resend";
import { createTwilioSmsCanal } from "@justwant/notify/channels/sms/twilio";
import { consoleCanal } from "@justwant/notify/channels/console";
import { auditPlugin } from "@justwant/notify/plugins/audit";
import { Resend } from "resend";
import twilio from "twilio";

const welcome = createTemplate<{ name: string; email: string; phone: string }>({
  id: "welcome",
  email:   (args) => ({ to: args.email, subject: `Welcome, ${args.name}!`, html: `<p>Hi ${args.name}</p>`, text: `Hi ${args.name}` }),
  sms:     (args) => ({ to: args.phone, body: `Hi ${args.name}, welcome!` }),
  console: (args) => ({ level: "info", text: `Welcome ${args.email}` }),
});

const notify = createNotify({
  templates: [welcome],
  canals: {
    email: createResendCanal({ client: new Resend(process.env.RESEND_API_KEY!), from: "Acme <no-reply@acme.com>" }),
    sms:   createTwilioSmsCanal({ client: twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!), from: "+15005550006" }),
    dev:   consoleCanal(),
  },
  plugins: [auditPlugin({ onSend: async ({ templateId, canalId, phase, result }) => { /* log */ } })],
  onError: "throw",
});

await notify.send({ templateId: "welcome", canalId: "email", args: { name: "Alice", email: "alice@example.com", phone: "+14155552671" } });
```

## createTemplate

`createTemplate<TArgs>({ id, email?, sms?, console?, webhook?, slack? })` — each key is `(args: TArgs) => <ChannelMessage>`. All channel keys are optional. Returns `Template<TArgs>`.

## createNotify options

| Option    | Type                        | Default    | Description |
|-----------|-----------------------------|------------|-------------|
| `templates` | `Template[]`              | —          | Initial template registry |
| `canals`    | `Record<string, Canal>`   | —          | Named canal instances |
| `repo`      | `NotifyRepository?`       | —          | Optional persistence for dynamic template management |
| `plugins`   | `NotifyPlugin[]?`         | `[]`       | Plugin pipeline |
| `onError`   | `"throw" \| "silent"`     | `"throw"`  | Error handling mode |

## NotifyInstance API

| Method | Requires | Description |
|--------|----------|-------------|
| `send({ templateId, canalId, args })` | — | Send a notification |
| `listTemplates()` | `repo` | List all templates |
| `getTemplate({ id })` | `repo` | Get template by ID |
| `createTemplate(template)` | `repo` | Add a template |
| `updateTemplate({ id, versions })` | `repo` | Update a template |
| `deleteTemplate({ id })` | `repo` | Delete a template |

## Channels

| Channel   | Kind        | Import                                   | Peer dep | Helper |
|-----------|-------------|------------------------------------------|----------|--------|
| Email     | `"email"`   | `@justwant/notify/channels/email/resend` | `resend` | `createResendCanal(options)` |
| SMS       | `"sms"`     | `@justwant/notify/channels/sms/twilio`   | `twilio` | `createTwilioSmsCanal(options)` |
| Console   | `"console"` | `@justwant/notify/channels/console`      | none     | `consoleCanal()` |
| Webhook   | `"webhook"` | — (no helper; implement via `createCanal`) | — | — |
| Slack     | `"slack"`   | — (no helper; implement via `createCanal`) | — | — |

### ResendAdapterOptions

| Field    | Type     | Required | Description |
|----------|----------|----------|-------------|
| `client` | `Resend` | Yes      | `new Resend(apiKey)` |
| `from`   | `string` | Yes      | Default from address |

### TwilioSmsAdapterOptions

| Field    | Type           | Required | Description |
|----------|----------------|----------|-------------|
| `client` | `TwilioClient` | Yes      | `twilio(accountSid, authToken)` |
| `from`   | `string`       | Yes      | Sending number (E.164) |

### Custom canal (webhook / slack)

```ts
import { createCanal } from "@justwant/notify";

const webhookCanal = createCanal({
  kind: "webhook",
  adapter: {
    async send(message) {
      await fetch(message.url, { method: "POST", headers: message.headers, body: JSON.stringify(message.body) });
    },
  },
});
```

## Message types

### EmailMessage

| Field         | Type                                                      | Required |
|---------------|-----------------------------------------------------------|----------|
| `to`          | `string`                                                  | Yes |
| `subject`     | `string`                                                  | Yes |
| `html`        | `string`                                                  | Yes |
| `text`        | `string`                                                  | No |
| `replyTo`     | `string`                                                  | No |
| `cc`          | `string[]`                                                | No |
| `bcc`         | `string[]`                                                | No |
| `attachments` | `Array<{ filename: string; content: string \| Buffer }>` | No |

### SmsMessage

| Field  | Type     | Required |
|--------|----------|----------|
| `to`   | `string` | Yes — E.164 |
| `body` | `string` | Yes |

### ConsoleMessage

| Field   | Type                                      | Required |
|---------|-------------------------------------------|----------|
| `level` | `"info" \| "warn" \| "error" \| "debug"` | Yes |
| `text`  | `string`                                  | Yes |

### WebhookMessage

| Field     | Type                     | Required |
|-----------|--------------------------|----------|
| `url`     | `string`                 | Yes |
| `body`    | `unknown`                | Yes |
| `headers` | `Record<string, string>` | No |

## Plugins

| Plugin | Import | Description |
|--------|--------|-------------|
| `auditPlugin` | `@justwant/notify/plugins/audit` | Log/record every notification send |

### auditPlugin `onSend` callback fields

| Field        | Type                   | Description |
|--------------|------------------------|-------------|
| `templateId` | `string`               | Template identifier |
| `canalId`    | `string`               | Canal identifier |
| `args`       | `unknown`              | Args passed to `notify.send` |
| `message`    | `ChannelMessage`       | Rendered message |
| `phase`      | `"before" \| "after"` | Before or after canal.send |
| `result`     | `unknown`              | `undefined` on success, error on failure (after only) |

### Custom plugin

```ts
import type { NotifyPlugin } from "@justwant/notify";

const metricsPlugin: NotifyPlugin = {
  onSend({ templateId, phase }) {
    if (phase === "before") metrics.increment(`notify.${templateId}`);
  },
};
```

## Repo

| Adapter | Import |
|---------|--------|
| `createMemoryNotifyRepository()` | `@justwant/notify/repo/memory` |

## Errors

`TemplateNotFoundError`, `CanalNotFoundError`, `TemplateVersionNotFoundError`
