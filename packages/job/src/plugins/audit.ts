/**
 * @justwant/job — auditPlugin
 * Logs each job execution for audit trail.
 */

import type { JobPlugin } from "../types.js";

export interface AuditEntry {
  jobId: string;
  startedAt: Date;
  durationMs: number;
  status: "success" | "failure";
  payloadHash?: string;
}

export interface AuditPluginOptions {
  audit: {
    log(entry: AuditEntry): void | Promise<void>;
  };
}

function simpleHash(obj: unknown): string {
  try {
    const str = JSON.stringify(obj ?? {});
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h).toString(36);
  } catch {
    return "?";
  }
}

export function auditPlugin(options: AuditPluginOptions): JobPlugin {
  const { audit } = options;

  return {
    beforeExecute: async (ctx, next) => {
      const startedAt = new Date();
      let status: "success" | "failure" = "success";
      try {
        await next();
      } catch (err) {
        status = "failure";
        throw err;
      } finally {
        const durationMs = Date.now() - startedAt.getTime();
        const payloadHash = simpleHash(ctx.payload);
        await audit.log({
          jobId: ctx.jobId,
          startedAt,
          durationMs,
          status,
          payloadHash,
        });
      }
    },
  };
}
