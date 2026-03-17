/**
 * @justwant/notify — auditPlugin
 * Logs or records metrics on send (before/after).
 */

import type { ChannelMessage, NotifyPlugin } from "../types.js";

export interface AuditPluginOptions {
  onSend?(options: {
    templateId: string;
    canalId: string;
    args: unknown;
    message: ChannelMessage;
    phase: "before" | "after";
    result?: unknown;
  }): void | Promise<void>;
}

export function auditPlugin(options: AuditPluginOptions): NotifyPlugin {
  const { onSend } = options;
  return {
    onSend,
  };
}
