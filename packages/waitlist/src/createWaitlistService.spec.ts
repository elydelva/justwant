import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { createMemoryWaitlistAdapter } from "./adapters/memory.js";
import { createWaitlistService } from "./createWaitlistService.js";
import { defineList } from "./defineList.js";
import { AlreadySubscribedError, NotSubscribedError } from "./errors.js";

describe("createWaitlistService", () => {
  const repo = createMemoryWaitlistAdapter();
  const service = createWaitlistService({ repo });
  const list = defineList({ id: "beta" })();

  test("subscribes and checks", async () => {
    await service.subscribe(list, { type: "user", id: "u1" });
    expect(await service.isSubscribed(list, { type: "user", id: "u1" })).toBe(true);
    expect(await service.isSubscribed(list, { type: "user", id: "u2" })).toBe(false);
  });

  test("throws AlreadySubscribedError on duplicate", async () => {
    await service.subscribe(list, { type: "user", id: "u3" });
    await expect(service.subscribe(list, { type: "user", id: "u3" })).rejects.toThrow(
      AlreadySubscribedError
    );
  });

  test("unsubscribes", async () => {
    await service.subscribe(list, { type: "user", id: "u4" });
    await service.unsubscribe(list, { type: "user", id: "u4" });
    expect(await service.isSubscribed(list, { type: "user", id: "u4" })).toBe(false);
  });

  test("throws NotSubscribedError when unsubscribing non-member", async () => {
    await expect(service.unsubscribe(list, { type: "user", id: "nonexistent" })).rejects.toThrow(
      NotSubscribedError
    );
  });

  test("counts subscribers", async () => {
    const countBefore = await service.count(list);
    await service.subscribe(list, { type: "user", id: "u5" });
    await service.subscribe(list, { type: "user", id: "u6" });
    expect(await service.count(list)).toBe(countBefore + 2);
  });

  test("returns position", async () => {
    const list2 = defineList({ id: "pos-test" })();
    await service.subscribe(list2, { type: "user", id: "p1" });
    await service.subscribe(list2, { type: "user", id: "p2" });
    await service.subscribe(list2, { type: "user", id: "p3" });
    const pos = await service.getPosition(list2, { type: "user", id: "p2" });
    expect(pos).toEqual({ position: 2, total: 3 });
  });

  test("pops FIFO", async () => {
    const list3 = defineList({ id: "fifo-test" })();
    await service.subscribe(list3, { type: "user", id: "f1" });
    await service.subscribe(list3, { type: "user", id: "f2" });
    const first = await service.pop(list3);
    expect(first?.actorId).toBe("f1");
    const second = await service.pop(list3);
    expect(second?.actorId).toBe("f2");
    const empty = await service.pop(list3);
    expect(empty).toBeNull();
  });

  test("invite subscribes with referredBy", async () => {
    const list4 = defineList({ id: "invite-test" })();
    await service.invite(list4, { type: "user", id: "inviter" }, { type: "user", id: "invitee" });
    const entry = (await service.listSubscribers(list4))[0];
    expect(entry?.metadata?.referredBy).toBe("user:inviter");
  });

  test("listSubscribers with pagination and orderBy", async () => {
    const list5 = defineList({ id: "list-test" })();
    await service.subscribe(list5, { type: "user", id: "a1" });
    await service.subscribe(list5, { type: "user", id: "a2" });
    await service.subscribe(list5, { type: "user", id: "a3" });
    const asc = await service.listSubscribers(list5, { limit: 2, offset: 0, orderBy: "asc" });
    expect(asc).toHaveLength(2);
    expect(asc[0]?.actorId).toBe("a1");
    const desc = await service.listSubscribers(list5, { limit: 2, offset: 1, orderBy: "desc" });
    expect(desc).toHaveLength(2);
  });

  test("subscribe with metadata", async () => {
    const list6 = defineList({ id: "meta-test" })();
    await service.subscribe(list6, { type: "user", id: "m1" }, { metadata: { source: "landing" } });
    const entry = (await service.listSubscribers(list6))[0];
    expect(entry?.metadata?.source).toBe("landing");
  });

  test("subscribe with priority and expiresAt", async () => {
    const list7 = defineList({ id: "opts-test" })();
    const future = new Date(Date.now() + 86400000);
    await service.subscribe(
      list7,
      { type: "user", id: "o1" },
      {
        priority: 5,
        expiresAt: future,
      }
    );
    const entry = (await service.listSubscribers(list7))[0];
    expect(entry?.priority).toBe(5);
    expect(entry?.expiresAt).toEqual(future);
  });

  test("Actor with within org", async () => {
    const list8 = defineList({ id: "org-test" })();
    await service.subscribe(list8, {
      type: "user",
      id: "x1",
      within: { type: "org", id: "org-1" },
    });
    expect(
      await service.isSubscribed(list8, {
        type: "user",
        id: "x1",
        within: { type: "org", id: "org-1" },
      })
    ).toBe(true);
    expect(await service.isSubscribed(list8, { type: "user", id: "x1" })).toBe(false);
  });

  test("accepts listKey string", async () => {
    await service.subscribe("string-list", { type: "user", id: "s1" });
    expect(await service.isSubscribed("string-list", { type: "user", id: "s1" })).toBe(true);
    expect(await service.count("string-list")).toBeGreaterThanOrEqual(1);
  });

  test("subscribeMany ignores AlreadySubscribed", async () => {
    const list9 = defineList({ id: "bulk-sub" })();
    await service.subscribe(list9, { type: "user", id: "b1" });
    const results = await service.subscribeMany(list9, [
      { type: "user", id: "b1" },
      { type: "user", id: "b2" },
    ]);
    expect(results).toHaveLength(1);
    expect(results[0]?.actorId).toBe("b2");
  });

  test("unsubscribeMany ignores NotSubscribed", async () => {
    const list10 = defineList({ id: "bulk-unsub" })();
    await service.subscribe(list10, { type: "user", id: "c1" });
    await service.unsubscribeMany(list10, [
      { type: "user", id: "nonexistent" },
      { type: "user", id: "c1" },
    ]);
    expect(await service.isSubscribed(list10, { type: "user", id: "c1" })).toBe(false);
  });

  test("validates metadata with schema", async () => {
    const schema = v.object({ source: v.string() });
    const list11 = defineList({ id: "schema-valid", schema })();
    await service.subscribe(
      list11,
      { type: "user", id: "v1" },
      {
        metadata: { source: "campaign" },
      }
    );
    const entry = (await service.listSubscribers(list11))[0];
    expect(entry?.metadata?.source).toBe("campaign");
  });

  test("validates metadata with schema when valid", async () => {
    const schema = v.object({ count: v.number() });
    const list12 = defineList({ id: "schema-valid-2", schema })();
    await service.subscribe(
      list12,
      { type: "user", id: "v3" },
      {
        metadata: { count: 42 },
      }
    );
    const entry = (await service.listSubscribers(list12))[0];
    expect(entry?.metadata).toEqual({ count: 42 });
  });

  test("invite calls referralService.refer when provided", async () => {
    const list13 = defineList({ id: "referral-test" })();
    const referCalls: Array<{ offer: string; referrer: unknown; recipient: unknown }> = [];
    const serviceWithReferral = createWaitlistService({
      repo,
      referralService: {
        refer: async (offer, referrer, recipient) => {
          referCalls.push({ offer, referrer, recipient });
        },
      },
    });
    await serviceWithReferral.invite(
      list13,
      { type: "user", id: "ref-inviter" },
      { type: "user", id: "ref-invitee" }
    );
    expect(referCalls).toHaveLength(1);
    expect(referCalls[0]?.offer).toBe("referral-test");
    expect(referCalls[0]?.referrer).toEqual({ type: "user", id: "ref-inviter" });
    expect(referCalls[0]?.recipient).toEqual({ type: "user", id: "ref-invitee" });
  });

  test("invite uses offerKeyForList when provided", async () => {
    const list14 = defineList({ id: "offer-key-test" })();
    let capturedOffer = "";
    const serviceWithOfferKey = createWaitlistService({
      repo,
      referralService: {
        refer: async (offer) => {
          capturedOffer = offer;
        },
      },
      offerKeyForList: (listKey) => `waitlist:${listKey}`,
    });
    await serviceWithOfferKey.invite(
      list14,
      { type: "user", id: "ok-inviter" },
      { type: "user", id: "ok-invitee" }
    );
    expect(capturedOffer).toBe("waitlist:offer-key-test");
  });
});
