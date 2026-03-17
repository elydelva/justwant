import { describe, expect, test } from "bun:test";
import { invite } from "./referral.js";

describe("invite (referral plugin)", () => {
  test("calls subscribeFn with metadata.referredBy when no referralService", async () => {
    const subscribeCalls: Array<{ actor: unknown; metadata?: unknown }> = [];
    const subscribeFn = async (_list: unknown, actor: unknown, opts?: { metadata?: unknown }) => {
      subscribeCalls.push({ actor, metadata: opts?.metadata });
      return {};
    };
    await invite(
      subscribeFn,
      { listKey: "beta" },
      { type: "user", id: "inviter" },
      { type: "user", id: "invitee" }
    );
    expect(subscribeCalls).toHaveLength(1);
    expect(subscribeCalls[0]?.actor).toEqual({ type: "user", id: "invitee" });
    expect((subscribeCalls[0]?.metadata as Record<string, unknown>)?.referredBy).toBe(
      "user:inviter"
    );
  });

  test("calls referralService.refer before subscribe when provided", async () => {
    const referCalls: Array<{ offer: string; referrer: unknown; recipient: unknown }> = [];
    const subscribeFn = async () => ({});
    await invite(
      subscribeFn,
      { listKey: "beta" },
      { type: "user", id: "inviter" },
      { type: "user", id: "invitee" },
      undefined,
      {
        refer: async (offer, referrer, recipient) => {
          referCalls.push({ offer, referrer, recipient });
        },
      }
    );
    expect(referCalls).toHaveLength(1);
    expect(referCalls[0]?.offer).toBe("beta");
    expect(referCalls[0]?.referrer).toEqual({ type: "user", id: "inviter" });
    expect(referCalls[0]?.recipient).toEqual({ type: "user", id: "invitee" });
  });

  test("uses offerKeyForList when provided", async () => {
    const referCalls: Array<{ offer: string }> = [];
    const subscribeFn = async () => ({});
    await invite(
      subscribeFn,
      { listKey: "beta" },
      { type: "user", id: "inviter" },
      { type: "user", id: "invitee" },
      undefined,
      {
        refer: async (offer) => {
          referCalls.push({ offer });
        },
      },
      (listKey) => `waitlist:${listKey}`
    );
    expect(referCalls[0]?.offer).toBe("waitlist:beta");
  });
});
