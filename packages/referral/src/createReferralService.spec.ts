import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { createReferralService } from "./createReferralService.js";
import { defineReferralOffer } from "./defineReferralOffer.js";
import { AlreadyReferredError } from "./errors.js";
import type { Actor, Referral, ReferralRepository } from "./types.js";

function createMockRepo(): ReferralRepository {
  const store: Referral[] = [];
  return {
    async create(data) {
      const r: Referral = {
        id: data.id ?? randomUUID(),
        offerKey: data.offerKey,
        referrerType: data.referrerType,
        referrerId: data.referrerId,
        recipientType: data.recipientType,
        recipientId: data.recipientId,
        referralCode: data.referralCode,
        metadata: data.metadata,
        createdAt: (data.createdAt as Date) ?? new Date(),
      };
      store.push(r);
      return r;
    },
    async findOne(where) {
      return (
        store.find(
          (r) =>
            (where.id == null || r.id === where.id) &&
            (where.offerKey == null || r.offerKey === where.offerKey) &&
            (where.referrerType == null || r.referrerType === where.referrerType) &&
            (where.referrerId == null || r.referrerId === where.referrerId) &&
            (where.recipientType == null || r.recipientType === where.recipientType) &&
            (where.recipientId == null || r.recipientId === where.recipientId) &&
            (where.referralCode == null || r.referralCode === where.referralCode)
        ) ?? null
      );
    },
    async findMany(where, opts = {}) {
      let items = store.filter(
        (r) =>
          (where.offerKey == null || r.offerKey === where.offerKey) &&
          (where.referrerType == null || r.referrerType === where.referrerType) &&
          (where.referrerId == null || r.referrerId === where.referrerId) &&
          (where.recipientType == null || r.recipientType === where.recipientType) &&
          (where.recipientId == null || r.recipientId === where.recipientId) &&
          (where.referralCode == null || r.referralCode === where.referralCode)
      );
      const { orderBy, limit = 50, offset = 0 } = opts;
      if (orderBy) {
        items = [...items].sort((a, b) => {
          const aVal = (a as Record<string, unknown>)[orderBy.field] as Date;
          const bVal = (b as Record<string, unknown>)[orderBy.field] as Date;
          const cmp = aVal.getTime() - bVal.getTime();
          return orderBy.direction === "asc" ? cmp : -cmp;
        });
      }
      return items.slice(offset, offset + limit);
    },
    async count(where) {
      return (await this.findMany(where, { limit: 9999 })).length;
    },
  };
}

const user = (id: string): Actor => ({ type: "user", id });
const offer = defineReferralOffer({ name: "waitlist_beta" });

describe("createReferralService", () => {
  test("refer creates referral and returns it", async () => {
    const repo = createMockRepo();
    const service = createReferralService({ repo });

    const referral = await service.refer(offer, user("u1"), user("u2"));

    expect(referral.offerKey).toBe("waitlist_beta");
    expect(referral.referrerId).toBe("u1");
    expect(referral.recipientId).toBe("u2");
    expect(referral.id).toBeDefined();
    expect(referral.createdAt).toBeInstanceOf(Date);
  });

  test("refer throws AlreadyReferredError when recipient already referred", async () => {
    const repo = createMockRepo();
    const service = createReferralService({ repo });

    await service.refer(offer, user("u1"), user("u2"));
    await expect(service.refer(offer, user("u3"), user("u2"))).rejects.toThrow(
      AlreadyReferredError
    );
  });

  test("getReferrer returns referrer when referral exists", async () => {
    const repo = createMockRepo();
    const service = createReferralService({ repo });
    await service.refer(offer, user("u1"), user("u2"));

    const referrer = await service.getReferrer(offer, user("u2"));
    expect(referrer).toEqual({ type: "user", id: "u1" });
  });

  test("getReferral returns referral when exists", async () => {
    const repo = createMockRepo();
    const service = createReferralService({ repo });
    await service.refer(offer, user("u1"), user("u2"));

    const ref = await service.getReferral(offer, user("u1"), user("u2"));
    expect(ref).not.toBeNull();
    expect(ref?.referrerId).toBe("u1");
    expect(ref?.recipientId).toBe("u2");
  });

  test("getReferral returns null when no referral", async () => {
    const repo = createMockRepo();
    const service = createReferralService({ repo });

    const ref = await service.getReferral(offer, user("u1"), user("u2"));
    expect(ref).toBeNull();
  });

  test("getReferrer returns null when no referral", async () => {
    const repo = createMockRepo();
    const service = createReferralService({ repo });

    const referrer = await service.getReferrer(offer, user("u2"));
    expect(referrer).toBeNull();
  });

  test("getRecipients returns list of referrals", async () => {
    const repo = createMockRepo();
    const service = createReferralService({ repo });
    await service.refer(offer, user("u1"), user("u2"));
    await service.refer(offer, user("u1"), user("u3"));

    const recipients = await service.getRecipients(offer, user("u1"));
    expect(recipients).toHaveLength(2);
    expect(recipients.map((r) => r.recipientId).sort()).toEqual(["u2", "u3"]);
  });

  test("countByReferrer returns correct count", async () => {
    const repo = createMockRepo();
    const service = createReferralService({ repo });
    await service.refer(offer, user("u1"), user("u2"));
    await service.refer(offer, user("u1"), user("u3"));

    const count = await service.countByReferrer(offer, user("u1"));
    expect(count).toBe(2);
  });

  test("countByOffer returns total for offer", async () => {
    const repo = createMockRepo();
    const service = createReferralService({ repo });
    await service.refer(offer, user("u1"), user("u2"));
    await service.refer(offer, user("u3"), user("u4"));

    const count = await service.countByOffer(offer);
    expect(count).toBe(2);
  });

  test("getReferralCode returns referrerId by default", async () => {
    const repo = createMockRepo();
    const service = createReferralService({ repo });

    const code = await service.getReferralCode(offer, user("u1"));
    expect(code).toBe("u1");
  });

  test("getReferralCode uses codeGenerator when provided", async () => {
    const customOffer = defineReferralOffer({
      name: "x",
      codeGenerator: (offerKey, referrer) => `${offerKey}-${referrer.id}`,
    });
    const repo = createMockRepo();
    const service = createReferralService({ repo });

    const code = await service.getReferralCode(customOffer, user("u1"));
    expect(code).toBe("x-u1");
  });

  test("getReferralCode resolves async codeGenerator", async () => {
    const asyncOffer = defineReferralOffer({
      name: "async-offer",
      codeGenerator: async () => "async-code",
    });
    const repo = createMockRepo();
    const service = createReferralService({ repo });

    const code = await service.getReferralCode(asyncOffer, user("u1"));
    expect(code).toBe("async-code");
  });

  test("resolveCode returns referrer when code matches referrerId", async () => {
    const repo = createMockRepo();
    const service = createReferralService({ repo });
    await service.refer(offer, user("u1"), user("u2"));

    const referrer = await service.resolveCode(offer, "u1");
    expect(referrer).toEqual({ type: "user", id: "u1" });
  });

  test("resolveCode returns referrer via defaultReferrerType when no referral yet", async () => {
    const offerWithDefault = defineReferralOffer({
      name: "waitlist",
      defaultReferrerType: "user",
    });
    const repo = createMockRepo();
    const service = createReferralService({ repo });

    const referrer = await service.resolveCode(offerWithDefault, "u99");
    expect(referrer).toEqual({ type: "user", id: "u99" });
  });

  test("resolveCode returns null when code unknown and no defaultReferrerType", async () => {
    const repo = createMockRepo();
    const service = createReferralService({ repo });

    const referrer = await service.resolveCode(offer, "unknown");
    expect(referrer).toBeNull();
  });

  test("accepts offer as string", async () => {
    const repo = createMockRepo();
    const service = createReferralService({ repo });

    const referral = await service.refer("custom_offer", user("u1"), user("u2"));
    expect(referral.offerKey).toBe("custom_offer");

    const count = await service.countByOffer("custom_offer");
    expect(count).toBe(1);
  });

  test("stores referralCode from metadata when creating referral", async () => {
    const repo = createMockRepo();
    const service = createReferralService({ repo });

    await service.refer(offer, user("u1"), user("u2"), {
      referralCode: "SHARE123",
    });

    const ref = await service.getReferral(offer, user("u1"), user("u2"));
    expect(ref?.referralCode).toBe("SHARE123");
  });

  test("getReferralCode reuses existing referralCode when referrer has referrals", async () => {
    const repo = createMockRepo();
    const service = createReferralService({ repo });
    await service.refer(offer, user("u1"), user("u2"), {
      referralCode: "SHARE-X",
    });

    const code = await service.getReferralCode(offer, user("u1"));
    expect(code).toBe("SHARE-X");
  });

  test("getRecipients respects limit and offset", async () => {
    const repo = createMockRepo();
    const service = createReferralService({ repo });
    for (let i = 1; i <= 5; i++) {
      await service.refer(offer, user("u1"), user(`u${i}`));
      if (i < 5) await new Promise((r) => setTimeout(r, 2));
    }

    const recipients = await service.getRecipients(offer, user("u1"), {
      limit: 2,
      offset: 1,
      orderBy: "asc",
    });
    expect(recipients).toHaveLength(2);
    expect(recipients[0].recipientId).toBe("u2");
    expect(recipients[1].recipientId).toBe("u3");
  });

  test("getRecipients orderBy asc returns oldest first", async () => {
    const repo = createMockRepo();
    const service = createReferralService({ repo });
    await service.refer(offer, user("u1"), user("first"));
    await new Promise((r) => setTimeout(r, 5));
    await service.refer(offer, user("u1"), user("second"));
    await new Promise((r) => setTimeout(r, 5));
    await service.refer(offer, user("u1"), user("third"));

    const recipients = await service.getRecipients(offer, user("u1"), {
      orderBy: "asc",
    });
    expect(recipients).toHaveLength(3);
    expect(recipients[0].recipientId).toBe("first");
    expect(recipients[1].recipientId).toBe("second");
    expect(recipients[2].recipientId).toBe("third");
  });

  test("createReferralService uses defaults.orderBy", async () => {
    const repo = createMockRepo();
    const service = createReferralService({
      repo,
      defaults: { orderBy: "asc" },
    });
    await service.refer(offer, user("u1"), user("first"));
    await new Promise((r) => setTimeout(r, 5));
    await service.refer(offer, user("u1"), user("second"));

    const recipients = await service.getRecipients(offer, user("u1"));
    expect(recipients[0].recipientId).toBe("first");
    expect(recipients[1].recipientId).toBe("second");
  });

  test("beforeRefer intercepts and calls next", async () => {
    const repo = createMockRepo();
    let beforeReferCalled = false;
    const plugin = {
      beforeRefer: async (
        _ctx: { offerKey: string; referrer: Actor; recipient: Actor },
        next: () => Promise<Referral>
      ) => {
        beforeReferCalled = true;
        return next();
      },
    };
    const service = createReferralService({ repo, plugins: [plugin] });

    const referral = await service.refer(offer, user("u1"), user("u2"));

    expect(beforeReferCalled).toBe(true);
    expect(referral.referrerId).toBe("u1");
    expect(referral.recipientId).toBe("u2");
  });

  test("beforeRefer can block by throwing before next", async () => {
    const repo = createMockRepo();
    const plugin = {
      beforeRefer: async () => {
        throw new Error("Blocked by plugin");
      },
    };
    const service = createReferralService({ repo, plugins: [plugin] });

    await expect(service.refer(offer, user("u1"), user("u2"))).rejects.toThrow("Blocked by plugin");
  });

  test("onError is called when refer throws", async () => {
    const repo = createMockRepo();
    let onErrorCalled = false;
    const plugin = {
      onError: async () => {
        onErrorCalled = true;
      },
    };
    const service = createReferralService({ repo, plugins: [plugin] });

    await service.refer(offer, user("u1"), user("u2"));
    await expect(service.refer(offer, user("u3"), user("u2"))).rejects.toThrow(
      AlreadyReferredError
    );

    expect(onErrorCalled).toBe(true);
  });

  test("plugin init receives context with setContext", async () => {
    const repo = createMockRepo();
    let initCalledWithContext = false;
    const plugin = {
      init: (ctx: { setContext?: (k: string, v: unknown) => void }) => {
        initCalledWithContext = "setContext" in ctx;
      },
    };
    createReferralService({ repo, plugins: [plugin] });

    expect(initCalledWithContext).toBe(true);
  });
});
