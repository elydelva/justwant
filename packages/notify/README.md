# @justwant/notify

Notifications via **templates** (one version per channel) and **canals** (email, SMS, console, etc.). Send = template + canal + args.

## Concept

- A **template** has an `id` and **one version per channel** (email, sms, console, …). Each version is a factory `(args) => Message`.
- **Canals** are send endpoints (Resend, Twilio, console, …). Each canal has a `kind` and `send(message)`.
- **createNotify** assembles templates and canals; **send({ templateId, canalId, args })** resolves the template version for that canal, builds the message, and sends it.

Optional **repo** for persistence (listTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate). Optional **plugins** (e.g. audit).

## Installation

```bash
bun add @justwant/notify
```

Third-party channels (email, SMS) accept **only the official SDK instance** (Resend, Twilio). No fetch or custom HTTP. Install `resend` or `twilio` when you use those canals.

---

## Usage

### createTemplate — id + canal versions

```ts
import { createTemplate } from "@justwant/notify";

type WelcomeArgs = { to: string; userName: string; link: string };
const welcome = createTemplate<WelcomeArgs>({
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
  console: (args) => ({ level: "info", text: `Welcome email to ${args.to}` }),
});
```

### createCanal — kind + adapter

Pass the **provider SDK instance** (Resend, Twilio) so they handle auth, retries, and API changes.

```ts
import { Resend } from "resend";
import { Twilio } from "twilio";
import { createCanal } from "@justwant/notify";
import { createResendAdapter } from "@justwant/notify/channels/email/resend";
import { createTwilioSmsAdapter } from "@justwant/notify/channels/sms/twilio";
import { consoleCanal } from "@justwant/notify/channels/console";

const resend = new Resend(process.env.RESEND_API_KEY);
const emailCanal = createCanal({
  kind: "email",
  adapter: createResendAdapter({
    client: resend,
    from: "App <noreply@example.com>",
  }),
});

const twilio = new Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);
const smsCanal = createCanal({
  kind: "sms",
  adapter: createTwilioSmsAdapter({
    client: twilio,
    from: "+1234567890",
  }),
});
const devCanal = consoleCanal();
```

### createNotify — send + optional repo

```ts
import { createNotify } from "@justwant/notify";
import { createMemoryNotifyRepository } from "@justwant/notify/repo/memory";
import { auditPlugin } from "@justwant/notify/plugins/audit";

const notify = createNotify({
  templates: [welcome],
  canals: {
    "email:default": emailCanal,
    "sms:twilio": smsCanal,
    "console:dev": devCanal,
  },
  repo: createMemoryNotifyRepository(),
  plugins: [
    auditPlugin({
      onSend: ({ templateId, canalId, phase }) =>
        console.log(phase, templateId, canalId),
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
```

### Repo (when provided)

- **listTemplates()** — list all (from repo)
- **getTemplate({ id })** — get one
- **createTemplate(template)** — add (and persist)
- **updateTemplate({ id, versions })** — update versions
- **deleteTemplate({ id })** — remove

Initial `templates` in createNotify populate the in-memory registry used for **send()**. When `repo` is set, list/get read from repo; create/update/delete write to repo and update the registry.

---

## Canals & adapters

| Channel | Adapter / helper | Import |
|--------|-------------------|--------|
| Console | createConsoleAdapter, consoleCanal | channels/console |
| Email   | createResendAdapter, createResendCanal | channels/email/resend |
| SMS     | createTwilioSmsAdapter, createTwilioSmsCanal | channels/sms/twilio |

### Console (dev)

```ts
import { consoleCanal } from "@justwant/notify/channels/console";
const canal = consoleCanal();
```

### Email (Resend)

Install `resend`, create the client, pass it to the adapter:

```ts
import { Resend } from "resend";
import { createResendAdapter } from "@justwant/notify/channels/email/resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const canal = createCanal({
  kind: "email",
  adapter: createResendAdapter({
    client: resend,
    from: "App <noreply@example.com>",
  }),
});
```

### SMS (Twilio)

Install `twilio`, create the client, pass it to the adapter:

```ts
import { Twilio } from "twilio";
import { createTwilioSmsAdapter } from "@justwant/notify/channels/sms/twilio";

const twilio = new Twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
const canal = createCanal({
  kind: "sms",
  adapter: createTwilioSmsAdapter({
    client: twilio,
    from: "+1234567890",
  }),
});
```

---

## Plugins

| Plugin | Options | Import |
|--------|---------|--------|
| auditPlugin | `{ onSend?({ templateId, canalId, args, message, phase, result? }) }` | plugins/audit |

---

## Integration with @justwant/job (alertPlugin)

Use **createAlertNotifier** to build the callback expected by `@justwant/job` alertPlugin:

```ts
import { createNotify, createAlertNotifier } from "@justwant/notify";
import { alertPlugin } from "@justwant/job/plugins/alert";

const notify = createNotify({ templates: [jobFailedTemplate], canals: { slack } });
const notifier = createAlertNotifier(notify, {
  templateId: "job-failed",
  canalId: "slack",
});

const job = createJob({
  plugins: [alertPlugin({ notify: notifier })],
  // ...
});
```

---

## API summary

- **createTemplate({ id, email?, sms?, console?, ... })** → Template
- **createCanal({ kind, adapter })** → Canal
- **createNotify({ templates, canals, repo?, plugins?, onError? })** → NotifyInstance
- **notify.send({ templateId, canalId, args })** → Promise&lt;void&gt;
- **createMemoryNotifyRepository()** → NotifyRepository
- **createAlertNotifier(notify, { templateId, canalId })** → (payload: AlertPayload) => Promise&lt;void&gt;

Errors: `TemplateNotFoundError`, `CanalNotFoundError`, `TemplateVersionNotFoundError`.

---

## Testing

- **Unit / integration:** use a mock adapter (`adapter: { send: async (msg) => sent.push(msg) }`) or the console canal. Run `bun test`.
- **E2E with real SDK:** Resend and Twilio provide test-friendly options so you can call the real API without real delivery or charges. See **[TESTING.md](./TESTING.md)** for:
  - **Resend:** [test addresses](https://resend.com/docs/knowledge-base/what-email-addresses-to-use-for-testing) (`delivered@resend.dev`, etc.)
  - **Twilio:** [test credentials](https://www.twilio.com/docs/iam/test-credentials) + [magic numbers](https://www.twilio.com/docs/iam/test-credentials#test-sms-messages-parameters-from) (e.g. From `+15005550006` for SMS)

Optional: run SDK e2e when credentials are set:  
`RESEND_API_KEY=re_xxx bun test src/channels.sdk-e2e.spec.ts` or  
`TWILIO_TEST_ACCOUNT_SID=ACxxx TWILIO_TEST_AUTH_TOKEN=xxx bun test src/channels.sdk-e2e.spec.ts`
