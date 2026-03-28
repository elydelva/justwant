# @justwant/notify

Notifications: templates (one version per channel) + canals (email, SMS, console). Send = template + canal + args.

## Usage

```ts
import { createTemplate, createCanal, createNotify } from "@justwant/notify";
import { createResendAdapter } from "@justwant/notify/channels/email/resend";
import { createTwilioSmsAdapter } from "@justwant/notify/channels/sms/twilio";
import { consoleCanal } from "@justwant/notify/channels/console";
import { createMemoryNotifyRepository } from "@justwant/notify/repo/memory";
import { auditPlugin } from "@justwant/notify/plugins/audit";

const welcome = createTemplate<{ to: string; name: string }>({
  id: "welcome",
  email: (args) => ({ to: args.to, subject: "Hi", html: `<p>Hi ${args.name}</p>` }),
  sms: (args) => ({ to: args.to, body: `Hi ${args.name}` }),
  console: (args) => ({ level: "info", text: `Welcome ${args.to}` }),
});

const notify = createNotify({
  templates: [welcome],
  canals: {
    "email:default": createCanal({ kind: "email", adapter: createResendAdapter({ client: resend, from }) }),
    "sms:twilio": createCanal({ kind: "sms", adapter: createTwilioSmsAdapter({ client: twilio, from }) }),
    "console:dev": consoleCanal(),
  },
  repo: createMemoryNotifyRepository(),
  plugins: [auditPlugin({ onSend: ({ templateId, canalId }) => console.log(templateId, canalId) })],
});

await notify.send({ templateId: "welcome", canalId: "email:default", args: { to: "a@b.com", name: "Alice" } });
```

## createTemplate

`createTemplate<TArgs>({ id, email?, sms?, console?, webhook?, slack? })` — each key is `(args: TArgs) => Message` for that channel. Returns `Template<TArgs>`.

## createCanal

`createCanal({ kind, adapter })` — `kind`: `"email" | "sms" | "console" | "webhook" | "slack"`. `adapter`: `{ send(message): Promise<void> }`. Helpers: `createEmailCanal`, `createSmsCanal`, `createConsoleCanal`.

## createNotify

| Option    | Type                    | Description |
|-----------|-------------------------|-------------|
| templates | Template[]              | Initial templates (used for send) |
| canals    | Record<string, Canal>   | Canal instances by id |
| repo      | NotifyRepository?       | Optional persistence |
| plugins   | NotifyPlugin[]?        | e.g. audit |
| onError   | "throw" \| "silent"?   | Default "throw" |

With `repo`: `listTemplates()`, `getTemplate({ id })`, `createTemplate(template)`, `updateTemplate({ id, versions })`, `deleteTemplate({ id })`.

## Repo

| Adapter | Import |
|---------|--------|
| createMemoryNotifyRepository | repo/memory |

## Canaux / providers

| Canal   | Adapter / helper           | Import |
|---------|----------------------------|--------|
| console | createConsoleAdapter, consoleCanal | channels/console |
| email   | createResendAdapter        | channels/email/resend |
| sms     | createTwilioSmsAdapter     | channels/sms/twilio |

## Plugins

| Plugin       | Options | Import |
|-------------|---------|--------|
| auditPlugin | `{ onSend? }` | plugins/audit |

## createAlertNotifier (job alertPlugin)

```ts
import { createAlertNotifier } from "@justwant/notify";
const notifier = createAlertNotifier(notify, { templateId: "job-failed", canalId: "slack" });
// alertPlugin({ notify: notifier })
```

## API

send, listTemplates?, getTemplate?, createTemplate?, updateTemplate?, deleteTemplate?. Errors: TemplateNotFoundError, CanalNotFoundError, TemplateVersionNotFoundError.
