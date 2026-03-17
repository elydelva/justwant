/**
 * @justwant/referral — Referral and affiliation system
 */

export { defineReferralOffer } from "./defineReferralOffer.js";
export type { DefineReferralOfferConfig } from "./defineReferralOffer.js";

export { createReferralService } from "./createReferralService.js";
export type { CreateReferralServiceOptions } from "./createReferralService.js";

export { auditPlugin } from "./plugins/audit.js";
export type { AuditPluginOptions, ReferralAuditEntry } from "./plugins/audit.js";

export {
  ReferralError,
  AlreadyReferredError,
  InvalidReferralCodeError,
} from "./errors.js";

export type {
  Actor,
  Referral,
  ReferralOfferDef,
  ReferralRepository,
  ReferralService,
  ReferralPlugin,
  ReferralPluginContext,
  CreateInput,
} from "./types.js";
