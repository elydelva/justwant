/**
 * @justwant/referral — defineReferralOffer
 * Separates offer definition from service for portability.
 */

import type { Actor, ReferralOfferDef } from "./types.js";

export interface DefineReferralOfferConfig<N extends string = string> {
  name: N;
  /** Params for parametrized offers (e.g. ["listId"] → offer per list). */
  params?: string[];
  /** Optional code generator. Default: referrerId or uuid. */
  codeGenerator?: (offerKey: string, referrer: Actor) => string | Promise<string>;
  /** Default referrer type when resolving code as referrerId (before any referral exists). */
  defaultReferrerType?: string;
}

function buildOfferKey(name: string, params?: Record<string, string>): string {
  if (!params || Object.keys(params).length === 0) return name;
  const parts = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`);
  return `${name}:${parts.join(":")}`;
}

/**
 * Define a referral offer. Extends Definable<N>.
 * offer(refId) → { type: N; id: refId }
 * offer.key(params?) → resolves offerKey string
 */
export function defineReferralOffer<N extends string>(
  config: DefineReferralOfferConfig<N>
): ReferralOfferDef<N> {
  const { name, params, codeGenerator, defaultReferrerType } = config;

  const offerDef = ((refId: string) => ({ type: name, id: refId })) as ReferralOfferDef<N>;

  const keyFn = (offerParams?: Record<string, string>): string => {
    if (params?.length && offerParams) {
      const filtered: Record<string, string> = {};
      for (const p of params) {
        if (offerParams[p] != null) filtered[p] = String(offerParams[p]);
      }
      return buildOfferKey(name, filtered);
    }
    return name;
  };

  Object.defineProperties(offerDef, {
    name: { value: name, enumerable: true },
    params: { value: params, enumerable: true },
    codeGenerator: { value: codeGenerator, enumerable: true },
    defaultReferrerType: { value: defaultReferrerType, enumerable: true },
    key: { value: keyFn, enumerable: false },
  });

  return offerDef;
}
