/**
 * E2E tests for referral package with SQLite in-memory.
 */
import { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createReferralService } from "./createReferralService.js";
import { defineReferralOffer } from "./defineReferralOffer.js";
import {
  CREATE_TABLE_SQL,
  createSqliteReferralRepository,
} from "./e2e/sqliteReferralRepository.js";
import { auditPlugin } from "./plugins/audit.js";
import type { Actor, ReferralRepository } from "./types.js";

const user = (id: string): Actor => ({ type: "user", id });

describe("E2E referral (SQLite)", () => {
  let db: Database;
  let repo: ReferralRepository;
  let service: ReturnType<typeof createReferralService>;

  beforeEach(() => {
    db = new Database(":memory:");
    db.run(CREATE_TABLE_SQL);
    repo = createSqliteReferralRepository(db);
    service = createReferralService({ repo });
  });

  afterEach(() => {
    db.close();
  });

  test("full flow: refer, getReferrer, getRecipients, countByReferrer, countByOffer", async () => {
    const offer = defineReferralOffer({ name: "waitlist_beta" });

    const r1 = await service.refer(offer, user("u1"), user("u2"));
    expect(r1.id).toBeDefined();
    expect(r1.offerKey).toBe("waitlist_beta");
    expect(r1.referrerId).toBe("u1");
    expect(r1.recipientId).toBe("u2");

    const referrer = await service.getReferrer(offer, user("u2"));
    expect(referrer).toEqual({ type: "user", id: "u1" });

    await service.refer(offer, user("u1"), user("u3"));
    const recipients = await service.getRecipients(offer, user("u1"));
    expect(recipients).toHaveLength(2);
    expect(recipients.map((r) => r.recipientId).sort()).toEqual(["u2", "u3"]);

    const countByReferrer = await service.countByReferrer(offer, user("u1"));
    expect(countByReferrer).toBe(2);

    const countByOffer = await service.countByOffer(offer);
    expect(countByOffer).toBe(2);
  });

  test("parametrized offer: offer with listId", async () => {
    const offer = defineReferralOffer({
      name: "waitlist",
      params: ["listId"],
      defaultReferrerType: "user",
    });

    await service.refer(offer.key({ listId: "beta" }), user("u1"), user("u2"));

    const referrer = await service.getReferrer(offer.key({ listId: "beta" }), user("u2"));
    expect(referrer).toEqual({ type: "user", id: "u1" });

    const referrerProd = await service.getReferrer(offer.key({ listId: "prod" }), user("u2"));
    expect(referrerProd).toBeNull();
  });

  test("resolveCode with stored referralCode", async () => {
    const offer = defineReferralOffer({ name: "waitlist_beta" });

    await service.refer(offer, user("u1"), user("u2"), {
      referralCode: "SHARE-ABC",
    });

    const referrer = await service.resolveCode(offer, "SHARE-ABC");
    expect(referrer).toEqual({ type: "user", id: "u1" });
  });

  test("auditPlugin with real DB", async () => {
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

    const svc = createReferralService({ repo, plugins: [plugin] });
    await svc.refer("audit_offer", user("u1"), user("u2"));

    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      offerKey: "audit_offer",
      referrerId: "u1",
      recipientId: "u2",
    });
  });

  test("pagination E2E: limit and offset", async () => {
    const offer = defineReferralOffer({ name: "pagination" });

    for (let i = 1; i <= 10; i++) {
      await service.refer(offer, user("u1"), user(`u${i}`));
      if (i < 10) await new Promise((r) => setTimeout(r, 2));
    }

    const page = await service.getRecipients(offer, user("u1"), {
      limit: 3,
      offset: 2,
      orderBy: "asc",
    });

    expect(page).toHaveLength(3);
    expect(page[0].recipientId).toBe("u3");
    expect(page[1].recipientId).toBe("u4");
    expect(page[2].recipientId).toBe("u5");
  });
});
