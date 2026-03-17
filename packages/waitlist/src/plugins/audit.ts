/**
 * @justwant/waitlist — auditPlugin
 * Logs subscribe, unsubscribe, pop operations for audit trail.
 */

import { actorKey } from "@justwant/actor";
import type { WaitlistPlugin } from "../types.js";

export interface AuditEntry {
  operation: string;
  listKey: string;
  actorKey?: string;
  entryId?: string;
  timestamp: Date;
}

export interface AuditPluginOptions {
  audit: {
    log(entry: AuditEntry): void | Promise<void>;
  };
}

export function auditPlugin(options: AuditPluginOptions): WaitlistPlugin {
  const { audit } = options;

  return {
    beforeExecute: async (ctx, next) => {
      const timestamp = new Date();
      const entry: AuditEntry = {
        operation: ctx.operation,
        listKey: ctx.listKey,
        actorKey: ctx.actor ? actorKey(ctx.actor) : undefined,
        timestamp,
      };
      await audit.log(entry);
      const result = await next();
      if (ctx.entry) {
        entry.entryId = ctx.entry.id;
      }
      return result;
    },
  };
}
