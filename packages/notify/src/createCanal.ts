/**
 * @justwant/notify — createCanal
 * Creates a channel instance for a given kind and adapter.
 */

import type {
  Canal,
  ChannelKind,
  ConsoleCanal,
  CreateCanalOptions,
  EmailCanal,
  SmsCanal,
} from "./types.js";

/**
 * Creates a canal from kind and adapter. The adapter must implement send(message) for that kind.
 */
export function createCanal<K extends ChannelKind>(options: CreateCanalOptions<K>): Canal {
  const { kind, adapter } = options;
  return {
    kind,
    send: adapter.send.bind(adapter),
  } as Canal;
}

// Type helpers for consumers that need a specific canal type
export function createEmailCanal(options: CreateCanalOptions<"email">): EmailCanal {
  return createCanal(options) as EmailCanal;
}

export function createSmsCanal(options: CreateCanalOptions<"sms">): SmsCanal {
  return createCanal(options) as SmsCanal;
}

export function createConsoleCanal(options: CreateCanalOptions<"console">): ConsoleCanal {
  return createCanal(options) as ConsoleCanal;
}
