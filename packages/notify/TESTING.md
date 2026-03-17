# Testing @justwant/notify

## Unit tests (no external services)

Use a **mock adapter**: an object with `send(message)` that records calls. No Resend or Twilio instance needed.

```ts
const sent: EmailMessage[] = [];
const canal = createCanal({
  kind: "email",
  adapter: { send: async (msg) => sent.push(msg) },
});
const notify = createNotify({ templates: [welcome], canals: { email: canal } });
await notify.send({ templateId: "welcome", canalId: "email", args: { ... } });
expect(sent).toHaveLength(1);
expect(sent[0].to).toBe("...");
```

All specs in `src/*.spec.ts` and `src/e2e.spec.ts` follow this approach (or use the console canal with a capture adapter). Run with:

```bash
bun test
```

---

## E2E with real SDK (Resend)

Resend recommends using **test addresses** so you don’t hit real inboxes or hurt deliverability.

- **Docs:** [What email addresses to use for testing](https://resend.com/docs/knowledge-base/what-email-addresses-to-use-for-testing)
- **Test addresses:**

| Address | Simulates |
|--------|-----------|
| `delivered@resend.dev` | Successful delivery |
| `bounced@resend.dev` | Bounce |
| `complained@resend.dev` | Spam complaint |
| `suppressed@resend.dev` | Suppression |

You can add a label after `+` (e.g. `delivered+test1@resend.dev`) to distinguish runs.

**Example (real Resend SDK, no mock):**

```ts
import { Resend } from "resend";
import { createNotify } from "@justwant/notify";
import { createTemplate } from "@justwant/notify";
import { createResendAdapter } from "@justwant/notify/channels/email/resend";
import { createCanal } from "@justwant/notify";

const resend = new Resend(process.env.RESEND_API_KEY);
const template = createTemplate<{ to: string }>({
  id: "test",
  email: (args) => ({
    to: args.to,
    subject: "Test",
    html: "<p>E2E</p>",
  }),
});
const notify = createNotify({
  templates: [template],
  canals: {
    email: createCanal({
      kind: "email",
      adapter: createResendAdapter({ client: resend, from: "onboarding@resend.dev" }),
    }),
  },
});

await notify.send({
  templateId: "test",
  canalId: "email",
  args: { to: "delivered@resend.dev" },
});
```

Use `RESEND_API_KEY` from your Resend dashboard. Sending to these test addresses uses your quota but doesn’t deliver to real users.

---

## E2E with real SDK (Twilio)

Twilio supports **test credentials** and **magic phone numbers** so you can call the real API without charges or real SMS.

- **Docs:** [Test credentials](https://www.twilio.com/docs/iam/test-credentials), [Magic input values](https://www.twilio.com/docs/iam/test-credentials#magic-input)
- **Setup:** In Twilio Console → Admin → Account management → API keys & tokens, use the **Test credentials** (Test Account SID + Test auth Token). Do **not** use live credentials with magic numbers.
- **SMS magic numbers (with test credentials):**
  - **From:** `+15005550006` → passes validation (use as sender).
  - **To:** e.g. `+15005550006` or any number not in the [magic error list](https://www.twilio.com/docs/iam/test-credentials#test-sms-messages-parameters-to).

**Example (real Twilio SDK, no mock):**

```ts
import twilio from "twilio";
import { createNotify } from "@justwant/notify";
import { createTemplate } from "@justwant/notify";
import { createTwilioSmsAdapter } from "@justwant/notify/channels/sms/twilio";
import { createCanal } from "@justwant/notify";

const client = twilio(
  process.env.TWILIO_TEST_ACCOUNT_SID!,
  process.env.TWILIO_TEST_AUTH_TOKEN!
);
const template = createTemplate<{ to: string; body: string }>({
  id: "test-sms",
  sms: (args) => ({ to: args.to, body: args.body }),
});
const notify = createNotify({
  templates: [template],
  canals: {
    sms: createCanal({
      kind: "sms",
      adapter: createTwilioSmsAdapter({
        client,
        from: "+15005550006",
      }),
    }),
  },
});

await notify.send({
  templateId: "test-sms",
  canalId: "sms",
  args: { to: "+15005550006", body: "E2E test" },
});
```

Set `TWILIO_TEST_ACCOUNT_SID` and `TWILIO_TEST_AUTH_TOKEN` to your **test** credentials. No real SMS is sent and your account is not charged.

---

## Running SDK E2E in this repo

Optional: run e2e that use the real Resend/Twilio SDK only when credentials are present:

```bash
# Resend (needs RESEND_API_KEY)
RESEND_API_KEY=re_xxx bun test src/channels.sdk-e2e.spec.ts

# Twilio (needs TWILIO_TEST_ACCOUNT_SID + TWILIO_TEST_AUTH_TOKEN)
TWILIO_TEST_ACCOUNT_SID=ACxxx TWILIO_TEST_AUTH_TOKEN=xxx bun test src/channels.sdk-e2e.spec.ts
```

See `src/channels.sdk-e2e.spec.ts` for the actual tests (they are skipped when the env vars are missing).
