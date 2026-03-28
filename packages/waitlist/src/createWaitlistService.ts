/**
 * @justwant/waitlist — createWaitlistService
 * Core API: subscribe, unsubscribe, isSubscribed, count, listSubscribers, getPosition, pop, bulk.
 */

import { actorKey, fromRepo, toRepo } from "@justwant/actor";
import type { WaitlistList } from "./defineList.js";
import { AlreadySubscribedError, EmptyWaitlistError, NotSubscribedError } from "./errors.js";
import type { Actor, WaitlistEntry, WaitlistPlugin, WaitlistRepository } from "./types.js";

function toListKey(list: WaitlistList | string): string {
  return typeof list === "string" ? list : list.listKey;
}

function validateMetadata<T>(schema: WaitlistList["schema"], value: unknown, listKey: string): T {
  if (!schema) return (value ?? {}) as T;
  const std = (schema as { "~standard"?: { validate: (v: unknown) => unknown } })["~standard"];
  if (!std?.validate) return (value ?? {}) as T;
  const result = std.validate(value);
  if (result && typeof (result as Promise<unknown>).then === "function") {
    throw new Error("Async validation not supported");
  }
  const r = result as {
    value?: T;
    issues?: readonly { message?: string; path?: string }[];
  };
  if (r.issues?.length) {
    throw new Error(
      `Metadata validation failed: ${(r.issues as { message?: string }[])
        .map((i) => i.message)
        .join(", ")}`
    );
  }
  return (r.value ?? value ?? {}) as T;
}

export interface CreateWaitlistServiceOptions {
  repo: WaitlistRepository;
  plugins?: WaitlistPlugin[];
  /** Optional referral service for invite() — requires @justwant/referral. */
  referralService?: {
    refer(
      offer: string,
      referrer: Actor,
      recipient: Actor,
      metadata?: Record<string, unknown>
    ): Promise<unknown>;
  };
  /** Map listKey to referral offer key. Default: use listKey. */
  offerKeyForList?: (listKey: string) => string;
  defaults?: Record<string, unknown>;
}

export interface WaitlistService {
  invite(
    list: WaitlistList | string,
    inviter: Actor,
    invitee: Actor,
    metadata?: Record<string, unknown>
  ): Promise<WaitlistEntry>;
  subscribe(
    list: WaitlistList | string,
    actor: Actor,
    opts?: { metadata?: Record<string, unknown>; priority?: number; expiresAt?: Date }
  ): Promise<WaitlistEntry>;
  unsubscribe(list: WaitlistList | string, actor: Actor): Promise<void>;
  isSubscribed(list: WaitlistList | string, actor: Actor): Promise<boolean>;
  count(list: WaitlistList | string): Promise<number>;
  listSubscribers(
    list: WaitlistList | string,
    opts?: { limit?: number; offset?: number; orderBy?: "asc" | "desc" }
  ): Promise<WaitlistEntry[]>;
  getPosition(
    list: WaitlistList | string,
    actor: Actor
  ): Promise<{ position: number; total: number }>;
  pop(list: WaitlistList | string): Promise<WaitlistEntry | null>;
  subscribeMany(
    list: WaitlistList | string,
    actors: Actor[],
    opts?: { metadata?: Record<string, unknown> }
  ): Promise<WaitlistEntry[]>;
  unsubscribeMany(list: WaitlistList | string, actors: Actor[]): Promise<void>;
}

export function createWaitlistService(options: CreateWaitlistServiceOptions): WaitlistService {
  const { repo, plugins = [], referralService, offerKeyForList } = options;

  const service: WaitlistService = {
    async invite(list, inviter, invitee, metadata = {}) {
      const key = toListKey(list);
      const offerKey = offerKeyForList ? offerKeyForList(key) : key;

      if (referralService) {
        await referralService.refer(offerKey, inviter, invitee, metadata);
      }

      return service.subscribe(list, invitee, {
        metadata: { ...metadata, referredBy: actorKey(inviter) },
      });
    },

    async subscribe(list, actor, opts = {}) {
      const key = toListKey(list);
      const listDef = typeof list === "string" ? undefined : list;
      const rawMetadata = opts.metadata ?? {};
      let metadata: Record<string, unknown>;
      if (listDef?.schema) {
        metadata = validateMetadata(listDef.schema, rawMetadata, key) as Record<string, unknown>;
      } else if (typeof rawMetadata === "object" && rawMetadata !== null) {
        metadata = rawMetadata as Record<string, unknown>;
      } else {
        metadata = {};
      }

      const shape = toRepo(actor);
      const existing = await repo.findOne({
        listKey: key,
        actorType: shape.actorType,
        actorId: shape.actorId,
        actorOrgId: shape.actorOrgId,
      });
      if (existing) {
        throw new AlreadySubscribedError(key, actorKey(actor));
      }

      const entry: Omit<WaitlistEntry, "id" | "createdAt"> = {
        listKey: key,
        actorType: shape.actorType,
        actorId: shape.actorId,
        actorOrgId: shape.actorOrgId,
        priority: opts.priority,
        metadata: Object.keys(metadata).length ? metadata : undefined,
        expiresAt: opts.expiresAt,
      };
      return repo.subscribe(entry);
    },

    async unsubscribe(list, actor) {
      const key = toListKey(list);
      const shape = toRepo(actor);
      const existing = await repo.findOne({
        listKey: key,
        actorType: shape.actorType,
        actorId: shape.actorId,
        actorOrgId: shape.actorOrgId,
      });
      if (!existing) {
        throw new NotSubscribedError(key, actorKey(actor));
      }
      await repo.unsubscribe(key, actorKey(actor));
    },

    async isSubscribed(list, actor) {
      const key = toListKey(list);
      const shape = toRepo(actor);
      const entry = await repo.findOne({
        listKey: key,
        actorType: shape.actorType,
        actorId: shape.actorId,
        actorOrgId: shape.actorOrgId,
      });
      return !!entry;
    },

    async count(list) {
      const key = toListKey(list);
      return repo.count({ listKey: key });
    },

    async listSubscribers(list, opts = {}) {
      const key = toListKey(list);
      const { limit = 50, offset = 0, orderBy = "asc" } = opts;
      return repo.findMany(
        { listKey: key },
        {
          orderBy: { field: "createdAt", direction: orderBy },
          limit,
          offset,
        }
      );
    },

    async getPosition(list, actor) {
      const key = toListKey(list);
      const shape = toRepo(actor);
      const entries = await repo.findMany(
        { listKey: key },
        { orderBy: { field: "createdAt", direction: "asc" } }
      );
      const total = entries.length;
      const idx = entries.findIndex(
        (e) =>
          e.actorType === shape.actorType &&
          e.actorId === shape.actorId &&
          (e.actorOrgId ?? undefined) === (shape.actorOrgId ?? undefined)
      );
      if (idx < 0) {
        throw new NotSubscribedError(key, actorKey(actor));
      }
      return { position: idx + 1, total };
    },

    async pop(list) {
      const key = toListKey(list);
      const entries = await repo.findMany(
        { listKey: key },
        {
          orderBy: { field: "createdAt", direction: "asc" },
          limit: 1,
        }
      );
      const first = entries[0];
      if (!first) return null;
      await repo.unsubscribe(key, actorKey(fromRepo(first)));
      return first;
    },

    async subscribeMany(list, actors, opts = {}) {
      const results: WaitlistEntry[] = [];
      for (const actor of actors) {
        try {
          const entry = await service.subscribe(list, actor, {
            metadata: opts.metadata,
          });
          results.push(entry);
        } catch (err) {
          if (!(err instanceof AlreadySubscribedError)) throw err;
        }
      }
      return results;
    },

    async unsubscribeMany(list, actors) {
      for (const actor of actors) {
        try {
          await service.unsubscribe(list, actor);
        } catch (err) {
          if (!(err instanceof NotSubscribedError)) throw err;
        }
      }
    },
  };

  return service;
}
