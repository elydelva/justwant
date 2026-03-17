import { describe, expect, test } from "bun:test";
import { createMemoryWaitlistAdapter } from "./adapters/memory.js";
import { createWaitlistService } from "./createWaitlistService.js";
import { defineList } from "./defineList.js";
import { auditPlugin } from "./plugins/audit.js";
import { cleanupExpired } from "./plugins/expiration.js";

describe("integration", () => {
  test("parameterized list: subscribe on 2 lists, count and position distinct", async () => {
    const repo = createMemoryWaitlistAdapter();
    const service = createWaitlistService({ repo });
    const launchList = defineList({ id: "launch", params: ["productId"] });
    const list1 = launchList("prod-1");
    const list2 = launchList("prod-2");

    await service.subscribe(list1, { type: "user", id: "u1" });
    await service.subscribe(list1, { type: "user", id: "u2" });
    await service.subscribe(list2, { type: "user", id: "u1" });

    expect(await service.count(list1)).toBe(2);
    expect(await service.count(list2)).toBe(1);
    const pos1 = await service.getPosition(list1, { type: "user", id: "u2" });
    expect(pos1).toEqual({ position: 2, total: 2 });
    const pos2 = await service.getPosition(list2, { type: "user", id: "u1" });
    expect(pos2).toEqual({ position: 1, total: 1 });
  });

  test("invite with referralService mock: refer and subscribe called", async () => {
    const repo = createMemoryWaitlistAdapter();
    const referCalls: unknown[] = [];
    const service = createWaitlistService({
      repo,
      referralService: {
        refer: async (...args) => {
          referCalls.push(args);
        },
      },
    });
    const list = defineList({ id: "referral-int" })();

    await service.invite(list, { type: "user", id: "inviter" }, { type: "user", id: "invitee" });

    expect(referCalls).toHaveLength(1);
    expect(await service.isSubscribed(list, { type: "user", id: "invitee" })).toBe(true);
    const entry = (await service.listSubscribers(list))[0];
    expect(entry?.metadata?.referredBy).toBe("user:inviter");
  });

  test("bulk and position: subscribeMany, getPosition for each, unsubscribeMany", async () => {
    const repo = createMemoryWaitlistAdapter();
    const service = createWaitlistService({ repo });
    const list = defineList({ id: "bulk-int" })();
    const actors = [
      { type: "user", id: "b1" },
      { type: "user", id: "b2" },
      { type: "user", id: "b3" },
    ];

    await service.subscribeMany(list, actors);
    expect(await service.count(list)).toBe(3);

    const pos2 = await service.getPosition(list, { type: "user", id: "b2" });
    expect(pos2).toEqual({ position: 2, total: 3 });

    await service.unsubscribeMany(list, actors);
    expect(await service.count(list)).toBe(0);
  });

  test("auditPlugin: service accepts plugin and subscribe succeeds", async () => {
    const repo = createMemoryWaitlistAdapter();
    const logs: Array<{ operation: string; listKey: string }> = [];
    const service = createWaitlistService({
      repo,
      plugins: [
        auditPlugin({
          audit: {
            log: (entry) => {
              logs.push(entry);
            },
          },
        }),
      ],
    });
    const list = defineList({ id: "audit-int" })();

    await service.subscribe(list, { type: "user", id: "u1" });

    expect(await service.isSubscribed(list, { type: "user", id: "u1" })).toBe(true);
  });

  test("cleanupExpired: entries with past expiresAt removed", async () => {
    const repo = createMemoryWaitlistAdapter();
    const service = createWaitlistService({ repo });
    const list = defineList({ id: "exp-int" })();
    const past = new Date(Date.now() - 86400000);

    await service.subscribe(list, { type: "user", id: "e1" }, { expiresAt: past });
    await service.subscribe(list, { type: "user", id: "e2" }, { expiresAt: past });
    await service.subscribe(list, { type: "user", id: "e3" });

    expect(await service.count(list)).toBe(3);

    const removed = await cleanupExpired(repo, list.listKey);
    expect(removed).toBe(2);
    expect(await service.count(list)).toBe(1);
    expect(await service.isSubscribed(list, { type: "user", id: "e3" })).toBe(true);
    expect(await service.isSubscribed(list, { type: "user", id: "e1" })).toBe(false);
  });
});
