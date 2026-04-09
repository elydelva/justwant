/**
 * Optional E2E with real Resend / Twilio SDK.
 * Run only when credentials are set; skipped otherwise.
 * See TESTING.md for official docs (Resend test addresses, Twilio test credentials + magic numbers).
 */

import { describe, test } from "bun:test";
import { createCanal } from "./createCanal.js";
import { createNotify } from "./createNotify.js";
import { createTemplate } from "./createTemplate.js";

const hasResend = Boolean(process.env.RESEND_API_KEY);
const hasTwilio =
  Boolean(process.env.TWILIO_TEST_ACCOUNT_SID) && Boolean(process.env.TWILIO_TEST_AUTH_TOKEN);

describe("channels SDK e2e (real Resend)", () => {
  test.skipIf(!hasResend)(
    "send email via real Resend SDK to test address delivered@resend.dev",
    async () => {
      const { Resend } = await import("resend");
      const { createResendAdapter } = await import("./channels/email/resend.js");

      const key = process.env.RESEND_API_KEY;
      if (!key) throw new Error("RESEND_API_KEY required for this test");
      const resend = new Resend(key);
      const template = createTemplate<{ to: string }>({
        id: "sdk-e2e-email",
        email: (args) => ({
          to: args.to,
          subject: "Notify SDK E2E",
          html: "<p>Real Resend SDK test</p>",
        }),
      });
      const notify = createNotify({
        templates: [template],
        canals: {
          email: createCanal({
            kind: "email",
            adapter: createResendAdapter({
              client: resend,
              from: "onboarding@resend.dev",
            }),
          }),
        },
      });

      await notify.send({
        templateId: "sdk-e2e-email",
        canalId: "email",
        args: { to: "delivered@resend.dev" },
      });
    }
  );
});

describe("channels SDK e2e (real Twilio)", () => {
  test.skipIf(!hasTwilio)(
    "send SMS via real Twilio SDK with test credentials and magic From number",
    async () => {
      const twilio = (await import("twilio")).default;
      const { createTwilioSmsAdapter } = await import("./channels/sms/twilio.js");

      const sid = process.env.TWILIO_TEST_ACCOUNT_SID;
      const token = process.env.TWILIO_TEST_AUTH_TOKEN;
      if (!sid || !token)
        throw new Error(
          "TWILIO_TEST_ACCOUNT_SID and TWILIO_TEST_AUTH_TOKEN required for this test"
        );
      const client = twilio(sid, token);
      const template = createTemplate<{ to: string; body: string }>({
        id: "sdk-e2e-sms",
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
        templateId: "sdk-e2e-sms",
        canalId: "sms",
        args: { to: "+15005550006", body: "Notify SDK E2E" },
      });
    }
  );
});
