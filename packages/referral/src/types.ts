/**
 * @justwant/referral — Core types
 * Actor, Referral, ReferralRepository, ReferralService.
 */

import type { Actor } from "@justwant/actor";

export type { Actor } from "@justwant/actor";

/** Parrainage — persisted entity. */
export interface Referral {
  id: string;
  offerKey: string;
  referrerType: string;
  referrerId: string;
  recipientType: string;
  recipientId: string;
  referralCode?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export type CreateInput<T> = Omit<T, "id" | "createdAt"> & {
  id?: string;
  createdAt?: Date;
};

export interface ReferralRepository {
  create(data: CreateInput<Referral>): Promise<Referral>;
  findOne(where: Partial<Referral>): Promise<Referral | null>;
  findMany(
    where: Partial<Referral>,
    opts?: {
      limit?: number;
      offset?: number;
      orderBy?: { field: string; direction: "asc" | "desc" };
    }
  ): Promise<Referral[]>;
  count(where: Partial<Referral>): Promise<number>;
}

/** Referral offer definition — portable, callable if params. */
export interface ReferralOfferDef {
  readonly id: string;
  readonly name?: string;
  readonly params?: string[];
  readonly codeGenerator?: (offerKey: string, referrer: Actor) => string | Promise<string>;
  /** Default referrer type when resolving code as referrerId (before any referral exists). */
  readonly defaultReferrerType?: string;
  /** Resolve offer key from params (e.g. "waitlist_beta" or "waitlist_beta:list-1"). */
  (params?: Record<string, string>): string;
}

/** Referral service API. */
export interface ReferralService {
  refer(
    offer: ReferralOfferDef | string,
    referrer: Actor,
    recipient: Actor,
    metadata?: Record<string, unknown>
  ): Promise<Referral>;
  getReferrer(offer: ReferralOfferDef | string, recipient: Actor): Promise<Actor | null>;
  getRecipients(
    offer: ReferralOfferDef | string,
    referrer: Actor,
    opts?: { limit?: number; offset?: number; orderBy?: "asc" | "desc" }
  ): Promise<Referral[]>;
  getReferral(
    offer: ReferralOfferDef | string,
    referrer: Actor,
    recipient: Actor
  ): Promise<Referral | null>;
  countByReferrer(offer: ReferralOfferDef | string, referrer: Actor): Promise<number>;
  countByOffer(offer: ReferralOfferDef | string): Promise<number>;
  getReferralCode(offer: ReferralOfferDef | string, referrer: Actor): Promise<string>;
  resolveCode(offer: ReferralOfferDef | string, code: string): Promise<Actor | null>;
}

/** Referral plugin context. */
export interface ReferralPluginContext {
  setContext?(key: string, value: unknown): void;
}

/** Referral plugin — beforeRefer, afterRefer, etc. */
export interface ReferralPlugin {
  init?(context: ReferralPluginContext): void;
  beforeRefer?(
    ctx: {
      offerKey: string;
      referrer: Actor;
      recipient: Actor;
      metadata?: Record<string, unknown>;
    },
    next: () => Promise<Referral>
  ): Promise<Referral>;
  afterRefer?(ctx: { referral: Referral }): Promise<void>;
  onError?(ctx: { offerKey: string; error: unknown }): Promise<void>;
}
