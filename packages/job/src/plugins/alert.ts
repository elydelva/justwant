/**
 * @justwant/job — alertPlugin
 * Notifies on job failure.
 */

import type { JobPlugin } from "../types.js";

export interface AlertPayload {
  jobId: string;
  error: unknown;
  runCount?: number;
}

export interface AlertPluginOptions {
  notify(payload: AlertPayload): void | Promise<void>;
}

export function alertPlugin(options: AlertPluginOptions): JobPlugin {
  const { notify } = options;

  return {
    onError: async (ctx) => {
      await notify({
        jobId: ctx.jobId,
        error: ctx.error,
      });
    },
  };
}
