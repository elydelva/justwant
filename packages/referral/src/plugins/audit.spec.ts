import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { createReferralService } from "../createReferralService.js";
import type { Actor, Referral, ReferralRepository } from "../types.js";
import { auditPlugin } from "./audit.js";

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
            (where.offerKey == null || r.offerKey === where.offerKey) &&
            (where.referrerId == null || r.referrerId === where.referrerId) &&
            (where.recipientId == null || r.recipientId === where.recipientId)
        ) ?? null
      );
    },
    async findMany(where, opts = {}) {
      const items = store.filter(
        (r) =>
          (where.offerKey == null || r.offerKey === where.offerKey) &&
          (where.referrerId == null || r.referrerId === where.referrerId)
      );
      const { offset = 0, limit = 50 } = opts;
      return items.slice(offset, offset + limit);
    },
    async count(where) {
      return (await this.findMany(where, { limit: 9999 })).length;
    },
  };
}

describe("auditPlugin", () => {
  test("logs referral after refer", async () => {
    const entries: Array<{ offerKey: string; referrerId: string; recipientId: string }> = [];
    const plugin = auditPlugin({
      audit: {
        log: (e) => {
          entries.push({
            offerKey: e.offerKey,
            referrerId: e.referrerId,
            recipientId: e.recipientId,
          });
        },
      },
    });

    const repo = createMockRepo();
    const service = createReferralService({
      repo,
      plugins: [plugin],
    });

    await service.refer("waitlist_beta", { type: "user", id: "u1" }, { type: "user", id: "u2" });

    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      offerKey: "waitlist_beta",
      referrerId: "u1",
      recipientId: "u2",
    });
  });
});
