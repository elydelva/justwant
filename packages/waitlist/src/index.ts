/**
 * @justwant/waitlist — Waitlist management
 * Inscription, referral, position, invitations, FIFO.
 */

export { defineList } from "./defineList.js";
export type {
  DefineListConfig,
  WaitlistDef,
  WaitlistList,
} from "./defineList.js";

export { createWaitlistService } from "./createWaitlistService.js";
export type {
  CreateWaitlistServiceOptions,
  WaitlistService,
} from "./createWaitlistService.js";

export { createWaitlistDbAdapter } from "./adapters/db.js";
export type {
  WaitlistTable,
  CreateWaitlistDbAdapterOptions,
} from "./adapters/db.js";

export { createMemoryWaitlistAdapter } from "./adapters/memory.js";

export {
  WaitlistError,
  AlreadySubscribedError,
  NotSubscribedError,
  EmptyWaitlistError,
} from "./errors.js";

export type {
  Actor,
  WaitlistEntry,
  WaitlistRepository,
  WaitlistPlugin,
  WaitlistPluginContext,
  FindManyOptions,
  WaitlistMetadataSchema,
} from "./types.js";

export { auditPlugin } from "./plugins/audit.js";
export type { AuditPluginOptions, AuditEntry } from "./plugins/audit.js";

export { cleanupExpired } from "./plugins/expiration.js";
export type { ExpirationPluginOptions } from "./plugins/expiration.js";

export { invite } from "./plugins/referral.js";
export type {
  ReferralServiceLike,
  ReferralPluginOptions,
} from "./plugins/referral.js";
