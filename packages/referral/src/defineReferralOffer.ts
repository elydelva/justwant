/**
 * @justwant/referral — defineReferralOffer
 * Separates offer definition from service for portability.
 */

import type { Actor, ReferralOfferDef } from "./types.js";

export interface DefineReferralOfferConfig {
  id: string;
  name?: string;
  /** Params for parametrized offers (e.g. ["listId"] → offer per list). */
  params?: string[];
  /** Optional schema for metadata validation (via @justwant/contract). */
  schema?: unknown;
  /** Optional code generator. Default: referrerId or uuid. */
  codeGenerator?: (offerKey: string, referrer: Actor) => string | Promise<string>;
  /** Default referrer type when resolving code as referrerId (before any referral exists). */
  defaultReferrerType?: string;
}

function buildOfferKey(id: string, params?: Record<string, string>): string {
  if (!params || Object.keys(params).length === 0) return id;
  const parts = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`);
  return `${id}:${parts.join(":")}`;
}

/**
 * Define a referral offer. The definition is portable between processes.
 * If params are provided, the returned def is callable: offer({ listId: "beta" }) → "waitlist_beta:listId:beta"
 */
export function defineReferralOffer(config: DefineReferralOfferConfig): ReferralOfferDef {
  const { id, name, params, codeGenerator, defaultReferrerType } = config;

  const keyFn = (offerParams?: Record<string, string>): string => {
    if (params?.length && offerParams) {
      const filtered: Record<string, string> = {};
      for (const p of params) {
        if (offerParams[p] != null) filtered[p] = String(offerParams[p]);
      }
      return buildOfferKey(id, filtered);
    }
    return id;
  };

  const props = { id, name, params, codeGenerator, defaultReferrerType };
  return new Proxy(keyFn, {
    get(_target, prop) {
      if (prop in props) return (props as Record<string | symbol, unknown>)[prop];
      return Reflect.get(keyFn as object, prop);
    },
  }) as ReferralOfferDef;
}
