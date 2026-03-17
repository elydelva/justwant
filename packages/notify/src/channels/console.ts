/**
 * @justwant/notify — Console channel adapter
 * Logs messages to console (dev only). No external dependency.
 */

import { createCanal } from "../createCanal.js";
import type { ConsoleMessage } from "../types.js";

const logByLevel = {
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

export function createConsoleAdapter(): {
  send(message: ConsoleMessage): Promise<void>;
} {
  return {
    async send(message: ConsoleMessage): Promise<void> {
      const log = logByLevel[message.level] ?? logByLevel.info;
      log(`[notify:console] ${message.text}`);
    },
  };
}

/**
 * Creates a console canal (kind: "console") that logs messages.
 */
export function consoleCanal() {
  return createCanal({
    kind: "console",
    adapter: createConsoleAdapter(),
  });
}
