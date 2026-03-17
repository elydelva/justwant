/**
 * @justwant/notify — Twilio SMS adapter
 * SDK only: pass your Twilio client instance (e.g. twilio(accountSid, authToken)). No fetch / raw HTTP.
 */

import { createCanal } from "../../createCanal.js";
import type { SmsMessage } from "../../types.js";

/** Minimal Twilio client shape — use the client returned by `twilio(accountSid, authToken)`. Twilio uses `export =` so we use a structural type. */
export interface TwilioClient {
  messages: {
    create(params: { from: string; to: string; body: string }): Promise<unknown>;
  };
}

export interface TwilioSmsAdapterOptions {
  /** Twilio client instance (e.g. `twilio(accountSid, authToken)`) */
  client: TwilioClient;
  /** Twilio phone number (E.164) to send from. */
  from: string;
}

export function createTwilioSmsAdapter(options: TwilioSmsAdapterOptions): {
  send(message: SmsMessage): Promise<void>;
} {
  const { client, from } = options;

  return {
    async send(message: SmsMessage): Promise<void> {
      await client.messages.create({
        from,
        to: message.to,
        body: message.body,
      });
    },
  };
}

/**
 * Creates an SMS canal using Twilio. Pass your Twilio client instance.
 */
export function createTwilioSmsCanal(options: TwilioSmsAdapterOptions) {
  return createCanal({
    kind: "sms",
    adapter: createTwilioSmsAdapter(options),
  });
}
