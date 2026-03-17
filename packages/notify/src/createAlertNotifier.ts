/**
 * @justwant/notify — createAlertNotifier
 * Helper for @justwant/job alertPlugin: send({ templateId, canalId, args: payload }).
 * No runtime dependency on @justwant/job; payload shape matches job AlertPayload.
 */

import type { NotifyInstance } from "./types.js";

/** Payload shape compatible with @justwant/job plugins/alert AlertPayload. */
export interface AlertPayload {
  jobId: string;
  error: unknown;
  runCount?: number;
}

export interface CreateAlertNotifierOptions {
  templateId: string;
  canalId: string;
}

/**
 * Returns a callback suitable for alertPlugin({ notify: ... }) that sends via the given
 * notify instance using the specified template and canal.
 */
export function createAlertNotifier(
  notify: NotifyInstance,
  options: CreateAlertNotifierOptions
): (payload: AlertPayload) => Promise<void> {
  const { templateId, canalId } = options;
  return (payload: AlertPayload) => notify.send({ templateId, canalId, args: payload });
}
