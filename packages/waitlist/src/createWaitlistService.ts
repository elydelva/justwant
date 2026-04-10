/**
 * @justwant/waitlist — createWaitlistService
 * Core API: subscribe, unsubscribe, isSubscribed, count, listSubscribers, getPosition, pop, bulk.
 */

import { actorKey, fromRepo, toRepo } from "@justwant/actor";
import type { WaitlistDef } from "./defineList.js";
import { AlreadySubscribedError, NotSubscribedError } from "./errors.js";
import type { Actor, WaitlistEntry, WaitlistPlugin, WaitlistRepository } from "./types.js";

function toListKey(list: WaitlistDef | string): string {
  return typeof list === "string" ? list : list.key();
}

function validateMetadata<T>(schema: WaitlistDef["schema"], value: unknown, listKey: string): T {
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
    list: WaitlistDef | string,
    inviter: Actor,
    invitee: Actor,
    metadata?: Record<string, unknown>
  ): Promise<WaitlistEntry>;
  subscribe(
    list: WaitlistDef | string,
    actor: Actor,
    opts?: { metadata?: Record<string, unknown>; priority?: number; expiresAt?: Date }
  ): Promise<WaitlistEntry>;
  unsubscribe(list: WaitlistDef | string, actor: Actor): Promise<void>;
  isSubscribed(list: WaitlistDef | string, actor: Actor): Promise<boolean>;
  count(list: WaitlistDef | string): Promise<number>;
  listSubscribers(
    list: WaitlistDef | string,
    opts?: { limit?: number; offset?: number; orderBy?: "asc" | "desc" }
  ): Promise<WaitlistEntry[]>;
  getPosition(
    list: WaitlistDef | string,
    actor: Actor
  ): Promise<{ position: number; total: number }>;
  pop(list: WaitlistDef | string): Promise<WaitlistEntry | null>;
  subscribeMany(
    list: WaitlistDef | string,
    actors: Actor[],
    opts?: { metadata?: Record<string, unknown> }
  ): Promise<WaitlistEntry[]>;
  unsubscribeMany(list: WaitlistDef | string, actors: Actor[]): Promise<void>;
}

async function runWithPlugins<T>(
  plugins: WaitlistPlugin[],
  ctx: {
    operation: string;
    listKey: string;
    actor?: Actor;
    entry?: WaitlistEntry;
    [key: string]: unknown;
  },
  fn: () => Promise<T>
): Promise<T> {
  let next: () => Promise<T> = fn;
  for (let i = plugins.length - 1; i >= 0; i--) {
    const p = plugins[i];
    const before = p?.beforeExecute;
    if (before) {
      const n = next;
      next = () => before(ctx, () => n()) as Promise<T>;
    }
  }

  let result: T;
  try {
    result = await next();
  } catch (err) {
    for (const plugin of plugins) {
      await plugin.onError?.({ operation: ctx.operation, error: err });
    }
    throw err;
  }

  for (const plugin of plugins) {
    await plugin.afterExecute?.(ctx, async () => result);
  }

  return result;
}

export function createWaitlistService(options: CreateWaitlistServiceOptions): WaitlistService {
  const { repo, plugins = [], referralService, offerKeyForList } = options;

  for (const plugin of plugins) {
    plugin.init?.({ setContext: undefined });
  }

  const service: WaitlistService = {
    async invite(list, inviter, invitee, metadata = {}) {
      const key = toListKey(list);
      return runWithPlugins(
        plugins,
        { operation: "invite", listKey: key, actor: invitee },
        async () => {
          const offerKey = offerKeyForList ? offerKeyForList(key) : key;
          if (referralService) {
            await referralService.refer(offerKey, inviter, invitee, metadata);
          }
          return service.subscribe(list, invitee, {
            metadata: { ...metadata, referredBy: actorKey(inviter) },
          });
        }
      );
    },

    async subscribe(list, actor, opts = {}) {
      const key = toListKey(list);
      return runWithPlugins(plugins, { operation: "subscribe", listKey: key, actor }, async () => {
        const listDef = typeof list === "string" ? undefined : list;
        const rawMetadata = opts.metadata ?? {};
        let metadata: Record<string, unknown>;
        if (listDef?.schema) {
          metadata = validateMetadata(listDef.schema, rawMetadata, key) as Record<string, unknown>;
        } else if (typeof rawMetadata === "object" && rawMetadata !== null) {
          metadata = rawMetadata;
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
      });
    },

    async unsubscribe(list, actor) {
      const key = toListKey(list);
      return runWithPlugins(
        plugins,
        { operation: "unsubscribe", listKey: key, actor },
        async () => {
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
        }
      );
    },

    async isSubscribed(list, actor) {
      const key = toListKey(list);
      return runWithPlugins(
        plugins,
        { operation: "isSubscribed", listKey: key, actor },
        async () => {
          const shape = toRepo(actor);
          const entry = await repo.findOne({
            listKey: key,
            actorType: shape.actorType,
            actorId: shape.actorId,
            actorOrgId: shape.actorOrgId,
          });
          return !!entry;
        }
      );
    },

    async count(list) {
      const key = toListKey(list);
      return runWithPlugins(plugins, { operation: "count", listKey: key }, async () => {
        return repo.count({ listKey: key });
      });
    },

    async listSubscribers(list, opts = {}) {
      const key = toListKey(list);
      return runWithPlugins(plugins, { operation: "listSubscribers", listKey: key }, async () => {
        const { limit = 50, offset = 0, orderBy = "asc" } = opts;
        return repo.findMany(
          { listKey: key },
          {
            orderBy: { field: "createdAt", direction: orderBy },
            limit,
            offset,
          }
        );
      });
    },

    async getPosition(list, actor) {
      const key = toListKey(list);
      return runWithPlugins(
        plugins,
        { operation: "getPosition", listKey: key, actor },
        async () => {
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
        }
      );
    },

    async pop(list) {
      const key = toListKey(list);
      return runWithPlugins(plugins, { operation: "pop", listKey: key }, async () => {
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
      });
    },

    async subscribeMany(list, actors, opts = {}) {
      const key = toListKey(list);
      return runWithPlugins(plugins, { operation: "subscribeMany", listKey: key }, async () => {
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
      });
    },

    async unsubscribeMany(list, actors) {
      const key = toListKey(list);
      return runWithPlugins(plugins, { operation: "unsubscribeMany", listKey: key }, async () => {
        for (const actor of actors) {
          try {
            await service.unsubscribe(list, actor);
          } catch (err) {
            if (!(err instanceof NotSubscribedError)) throw err;
          }
        }
      });
    },
  };

  return service;
}
