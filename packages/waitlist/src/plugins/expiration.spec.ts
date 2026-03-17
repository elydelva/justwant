import { describe, expect, test } from "bun:test";
import type { WaitlistRepository } from "../types.js";
import { cleanupExpired } from "./expiration.js";

describe("cleanupExpired", () => {
  test("removes expired entries and returns count", async () => {
    const past = new Date(Date.now() - 86400000);
    const future = new Date(Date.now() + 86400000);
    const unsubCalls: Array<{ listKey: string; actorKey: string }> = [];
    const repo: WaitlistRepository = {
      subscribe: async () => ({}) as never,
      unsubscribe: async (listKey, actorKey) => unsubCalls.push({ listKey, actorKey }),
      findOne: async () => null,
      findMany: async () => [
        {
          id: "1",
          listKey: "beta",
          actorType: "user",
          actorId: "u1",
          createdAt: new Date(),
          expiresAt: past,
        },
        {
          id: "2",
          listKey: "beta",
          actorType: "user",
          actorId: "u2",
          createdAt: new Date(),
          expiresAt: future,
        },
      ],
      count: async () => 0,
      delete: async () => {},
    };
    const removed = await cleanupExpired(repo, "beta");
    expect(removed).toBe(1);
    expect(unsubCalls).toHaveLength(1);
    expect(unsubCalls[0]?.actorKey).toBe("user:u1");
  });

  test("returns 0 when no expired entries", async () => {
    const future = new Date(Date.now() + 86400000);
    const repo: WaitlistRepository = {
      subscribe: async () => ({}) as never,
      unsubscribe: async () => {},
      findOne: async () => null,
      findMany: async () => [
        {
          id: "1",
          listKey: "beta",
          actorType: "user",
          actorId: "u1",
          createdAt: new Date(),
          expiresAt: future,
        },
      ],
      count: async () => 0,
      delete: async () => {},
    };
    const removed = await cleanupExpired(repo, "beta");
    expect(removed).toBe(0);
  });

  test("uses correct actorKey format for entry with actorOrgId", async () => {
    const past = new Date(Date.now() - 86400000);
    const unsubCalls: Array<{ listKey: string; actorKey: string }> = [];
    const repo: WaitlistRepository = {
      subscribe: async () => ({}) as never,
      unsubscribe: async (listKey, actorKey) => unsubCalls.push({ listKey, actorKey }),
      findOne: async () => null,
      findMany: async () => [
        {
          id: "1",
          listKey: "beta",
          actorType: "user",
          actorId: "u1",
          actorOrgId: "org-1",
          createdAt: new Date(),
          expiresAt: past,
        },
      ],
      count: async () => 0,
      delete: async () => {},
    };
    await cleanupExpired(repo, "beta");
    expect(unsubCalls[0]?.actorKey).toBe("user:u1:org:org-1");
  });
});
