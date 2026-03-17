/**
 * @justwant/referral — auditPlugin
 * Logs each referral for audit trail.
 */

import type { Referral, ReferralPlugin } from "../types.js";

export interface ReferralAuditEntry {
  offerKey: string;
  referrerType: string;
  referrerId: string;
  recipientType: string;
  recipientId: string;
  referralId: string;
  referralCode?: string;
  createdAt: Date;
}

export interface AuditPluginOptions {
  audit: {
    log(entry: ReferralAuditEntry): void | Promise<void>;
  };
}

export function auditPlugin(options: AuditPluginOptions): ReferralPlugin {
  const { audit } = options;

  return {
    afterRefer: async (ctx) => {
      const r = ctx.referral;
      await audit.log({
        offerKey: r.offerKey,
        referrerType: r.referrerType,
        referrerId: r.referrerId,
        recipientType: r.recipientType,
        recipientId: r.recipientId,
        referralId: r.id,
        referralCode: r.referralCode,
        createdAt: r.createdAt,
      });
    },
  };
}
