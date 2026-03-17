/**
 * @justwant/referral — createReferralService
 * Orchestrates repo and plugins for unified referral API.
 */

import { randomUUID } from "node:crypto";
import { AlreadyReferredError } from "./errors.js";
import type {
  Actor,
  CreateInput,
  Referral,
  ReferralOfferDef,
  ReferralPlugin,
  ReferralRepository,
  ReferralService,
} from "./types.js";

export interface CreateReferralServiceOptions {
  repo: ReferralRepository;
  plugins?: ReferralPlugin[];
  defaults?: {
    /** Default order for getRecipients. */
    orderBy?: "asc" | "desc";
  };
}

function resolveOfferKey(offer: ReferralOfferDef | string): string {
  return typeof offer === "string" ? offer : offer();
}

function toActor(referral: Referral): Actor {
  return { type: referral.referrerType, id: referral.referrerId };
}

export function createReferralService(options: CreateReferralServiceOptions): ReferralService {
  const { repo, plugins = [], defaults } = options;

  const pluginContext = { setContext: undefined as ((k: string, v: unknown) => void) | undefined };
  for (const plugin of plugins) {
    plugin.init?.(pluginContext);
  }

  async function runReferChain(
    offerKey: string,
    referrer: Actor,
    recipient: Actor,
    metadata?: Record<string, unknown>
  ): Promise<Referral> {
    const createReferral = async (): Promise<Referral> => {
      const existing = await repo.findOne({
        offerKey,
        recipientType: recipient.type,
        recipientId: recipient.id,
      });
      if (existing) {
        throw new AlreadyReferredError(offerKey, recipient.id);
      }

      const referralCode = metadata?.referralCode as string | undefined;
      const data: CreateInput<Referral> = {
        offerKey,
        referrerType: referrer.type,
        referrerId: referrer.id,
        recipientType: recipient.type,
        recipientId: recipient.id,
        referralCode: referralCode ?? undefined,
        metadata,
        createdAt: new Date(),
      };
      return repo.create(data);
    };

    let next: () => Promise<Referral> = createReferral;
    for (let i = plugins.length - 1; i >= 0; i--) {
      const p = plugins[i];
      const before = p?.beforeRefer;
      if (before) {
        const n = next;
        next = () => before({ offerKey, referrer, recipient, metadata }, () => n());
      }
    }

    const referral = await next();

    for (const plugin of plugins) {
      await plugin.afterRefer?.({ referral });
    }

    return referral;
  }

  const service: ReferralService = {
    async refer(offer, referrer, recipient, metadata): Promise<Referral> {
      const offerKey = resolveOfferKey(offer);
      try {
        return await runReferChain(offerKey, referrer, recipient, metadata);
      } catch (err) {
        for (const plugin of plugins) {
          await plugin.onError?.({ offerKey, error: err });
        }
        throw err;
      }
    },

    async getReferrer(offer, recipient): Promise<Actor | null> {
      const offerKey = resolveOfferKey(offer);
      const referral = await repo.findOne({
        offerKey,
        recipientType: recipient.type,
        recipientId: recipient.id,
      });
      return referral ? toActor(referral) : null;
    },

    async getRecipients(offer, referrer, opts = {}): Promise<Referral[]> {
      const offerKey = resolveOfferKey(offer);
      const { limit = 50, offset = 0, orderBy = defaults?.orderBy ?? "desc" } = opts;
      return repo.findMany(
        {
          offerKey,
          referrerType: referrer.type,
          referrerId: referrer.id,
        },
        {
          limit,
          offset,
          orderBy: { field: "createdAt", direction: orderBy },
        }
      );
    },

    async getReferral(offer, referrer, recipient): Promise<Referral | null> {
      const offerKey = resolveOfferKey(offer);
      return repo.findOne({
        offerKey,
        referrerType: referrer.type,
        referrerId: referrer.id,
        recipientType: recipient.type,
        recipientId: recipient.id,
      });
    },

    async countByReferrer(offer, referrer): Promise<number> {
      const offerKey = resolveOfferKey(offer);
      return repo.count({
        offerKey,
        referrerType: referrer.type,
        referrerId: referrer.id,
      });
    },

    async countByOffer(offer): Promise<number> {
      const offerKey = resolveOfferKey(offer);
      return repo.count({ offerKey });
    },

    async getReferralCode(offer, referrer): Promise<string> {
      const offerKey = resolveOfferKey(offer);
      const offerDef = typeof offer === "string" ? null : offer;
      const codeGenerator = offerDef?.codeGenerator;

      if (codeGenerator) {
        return await codeGenerator(offerKey, referrer);
      }

      // Check if referrer already has a referral with a code (reuse)
      const existing = await repo.findOne({
        offerKey,
        referrerType: referrer.type,
        referrerId: referrer.id,
      });
      if (existing?.referralCode) {
        return existing.referralCode;
      }

      // Default: use referrerId or uuid
      return referrer.id || randomUUID();
    },

    async resolveCode(offer, code): Promise<Actor | null> {
      const offerKey = resolveOfferKey(offer);
      const offerDef = typeof offer === "string" ? null : offer;

      // First try: code stored on a referral (used by a filleul)
      const referral = await repo.findOne({
        offerKey,
        referralCode: code,
      });
      if (referral) return toActor(referral);

      // Fallback: code may be referrerId (default when no codeGenerator)
      const byReferrer = await repo.findMany({ offerKey, referrerId: code }, { limit: 1 });
      if (byReferrer[0]) return toActor(byReferrer[0]);

      // Before any referral exists: assume code is referrerId if defaultReferrerType set
      if (offerDef?.defaultReferrerType) {
        return { type: offerDef.defaultReferrerType, id: code };
      }
      return null;
    },
  };

  return service;
}
