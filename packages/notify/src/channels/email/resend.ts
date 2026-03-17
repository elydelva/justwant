/**
 * @justwant/notify — Resend email adapter
 * SDK only: pass your Resend instance (e.g. new Resend(apiKey)). No fetch / raw HTTP.
 */

import type { Resend } from "resend";
import { createCanal } from "../../createCanal.js";
import type { EmailMessage } from "../../types.js";

export interface ResendAdapterOptions {
  /** Resend client instance (e.g. `new Resend(process.env.RESEND_API_KEY)`) */
  client: Resend;
  /** Default "from" address. Format: "Name <email>" or "email". */
  from: string;
}

function toBase64(content: string | Buffer): string {
  if (typeof content === "string") {
    return Buffer.from(content, "utf-8").toString("base64");
  }
  return content.toString("base64");
}

export function createResendAdapter(options: ResendAdapterOptions): {
  send(message: EmailMessage): Promise<void>;
} {
  const { client, from } = options;

  return {
    async send(message: EmailMessage): Promise<void> {
      const params: Parameters<Resend["emails"]["send"]>[0] = {
        from,
        to: message.to,
        subject: message.subject,
        html: message.html,
      };
      if (message.text !== undefined) params.text = message.text;
      if (message.replyTo) params.replyTo = message.replyTo;
      if (message.cc?.length) params.cc = message.cc;
      if (message.bcc?.length) params.bcc = message.bcc;
      if (message.attachments?.length) {
        params.attachments = message.attachments.map((a) => ({
          filename: a.filename,
          content: toBase64(a.content),
        }));
      }

      const { error } = await client.emails.send(params);
      if (error) {
        throw new Error(
          typeof error === "object" && error !== null && "message" in error
            ? String((error as { message: unknown }).message)
            : String(error)
        );
      }
    },
  };
}

/**
 * Creates an email canal using Resend. Pass your Resend instance.
 */
export function createResendCanal(options: ResendAdapterOptions) {
  return createCanal({
    kind: "email",
    adapter: createResendAdapter(options),
  });
}
