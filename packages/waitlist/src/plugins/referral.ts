/**
 * @justwant/waitlist — referralPlugin
 * Invitation/referral integration via @justwant/referral.
 */

import { actorKey } from "@justwant/actor";
import type { Actor } from "../types.js";

/** Referral service from @justwant/referral. */
export interface ReferralServiceLike {
  refer(
    offer: string,
    referrer: Actor,
    recipient: Actor,
    metadata?: Record<string, unknown>
  ): Promise<unknown>;
}

export interface ReferralPluginOptions {
  referralService: ReferralServiceLike;
  /** Map listKey to referral offer key. Default: use listKey as offer key. */
  offerKeyForList?: (listKey: string) => string;
}

/**
 * Subscribe an invitee with referredBy metadata and optionally register with referral service.
 * Use with createWaitlistService when referralService is provided in options.
 */
export async function invite(
  subscribeFn: (
    list: unknown,
    actor: Actor,
    opts?: { metadata?: Record<string, unknown> }
  ) => Promise<unknown>,
  list: { listKey: string } | string,
  inviter: Actor,
  invitee: Actor,
  metadata?: Record<string, unknown>,
  referralService?: ReferralServiceLike,
  offerKeyForList?: (listKey: string) => string
): Promise<unknown> {
  const listKey = typeof list === "string" ? list : list.listKey;
  const offerKey = offerKeyForList ? offerKeyForList(listKey) : listKey;

  if (referralService) {
    await referralService.refer(offerKey, inviter, invitee, metadata);
  }

  return subscribeFn(list, invitee, {
    metadata: {
      ...metadata,
      referredBy: actorKey(inviter),
    },
  });
}
