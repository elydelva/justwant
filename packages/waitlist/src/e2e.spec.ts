/**
 * E2E tests against real DB adapter (Waddler SQLite).
 */
import { describe, expect, test } from "bun:test";
import { defineContract, field, json } from "@justwant/contract";
import { createWaitlistDbAdapter } from "./adapters/db.js";
import { createWaitlistService } from "./createWaitlistService.js";
import { defineList } from "./defineList.js";
import { cleanupExpired } from "./plugins/expiration.js";

const WaitlistEntryContract = defineContract({
  id: field<string>().required(),
  listKey: field<string>().required(),
  actorType: field<string>().required(),
  actorId: field<string>().required(),
  actorOrgId: field<string>().optional(),
  position: field<number>().optional(),
  priority: field<number>().optional(),
  metadata: json().optional(),
  referredBy: field<string>().optional(),
  createdAt: field<Date>().required(),
  expiresAt: field<Date>().optional(),
});

const mapping = {
  id: { name: "id" },
  listKey: { name: "list_key" },
  actorType: { name: "actor_type" },
  actorId: { name: "actor_id" },
  actorOrgId: { name: "actor_org_id" },
  position: { name: "position" },
  priority: { name: "priority" },
  metadata: { name: "metadata" },
  referredBy: { name: "referred_by" },
  createdAt: { name: "created_at" },
  expiresAt: { name: "expires_at" },
};

async function createE2ESetup() {
  const { waddler } = await import("waddler/bun-sqlite");
  const sql = waddler(":memory:");
  await sql`CREATE TABLE waitlist_e2e (
    id TEXT PRIMARY KEY,
    list_key TEXT NOT NULL,
    actor_type TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    actor_org_id TEXT,
    position INTEGER,
    priority INTEGER,
    metadata TEXT,
    referred_by TEXT,
    created_at TEXT NOT NULL,
    expires_at TEXT
  )`;

  const { createWaddlerAdapter } = await import("@justwant/db/waddler");
  const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
  const table = adapter.defineTable("waitlist_e2e", WaitlistEntryContract, mapping);

  const toDate = (v: unknown): Date | undefined =>
    v ? (v instanceof Date ? v : new Date(v as string)) : undefined;

  const fromRow = (r: Record<string, unknown>) => ({
    ...r,
    createdAt: toDate(r.createdAt) ?? new Date(),
    expiresAt: toDate(r.expiresAt),
    metadata:
      typeof r.metadata === "string"
        ? (JSON.parse(r.metadata || "{}") as Record<string, unknown>)
        : r.metadata,
  });

  const waitlistTable = {
    async create(data: Record<string, unknown>) {
      const clean: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(data)) {
        if (v === undefined) continue;
        clean[k] =
          v instanceof Date
            ? v.toISOString()
            : k === "metadata" && v && typeof v === "object"
              ? JSON.stringify(v)
              : v;
      }
      if (!clean.createdAt) clean.createdAt = new Date().toISOString();
      const result = await table.create(clean as never);
      return fromRow(result as Record<string, unknown>);
    },
    findOne: (where: Record<string, unknown>) =>
      table.findOne(where as never).then((r) => (r ? fromRow(r as Record<string, unknown>) : null)),
    findMany: (where: Record<string, unknown>) =>
      table
        .findMany(where as never)
        .then((rows) => rows.map((r) => fromRow(r as Record<string, unknown>))),
    delete: (id: string) => table.delete(id),
  };

  const repo = createWaitlistDbAdapter({ table: waitlistTable });
  return { repo, service: createWaitlistService({ repo }) };
}

describe("E2E (Waddler SQLite)", () => {
  test("full CRUD: subscribe, isSubscribed, count, listSubscribers, getPosition, pop, unsubscribe", async () => {
    const { service } = await createE2ESetup();
    const list = defineList({ id: "e2e-crud" })();

    await service.subscribe(list, { type: "user", id: "u1" });
    expect(await service.isSubscribed(list, { type: "user", id: "u1" })).toBe(true);
    expect(await service.count(list)).toBe(1);

    const subscribers = await service.listSubscribers(list);
    expect(subscribers).toHaveLength(1);
    expect(subscribers[0]?.actorId).toBe("u1");

    const pos = await service.getPosition(list, { type: "user", id: "u1" });
    expect(pos).toEqual({ position: 1, total: 1 });

    const popped = await service.pop(list);
    expect(popped?.actorId).toBe("u1");
    expect(await service.count(list)).toBe(0);

    await service.subscribe(list, { type: "user", id: "u2" });
    await service.unsubscribe(list, { type: "user", id: "u2" });
    expect(await service.isSubscribed(list, { type: "user", id: "u2" })).toBe(false);
  });

  test("parameterized list: 2 listKeys isolate data", async () => {
    const { service } = await createE2ESetup();
    const launchList = defineList({ id: "launch", params: ["productId"] });
    const list1 = launchList("prod-1");
    const list2 = launchList("prod-2");

    await service.subscribe(list1, { type: "user", id: "u1" });
    await service.subscribe(list2, { type: "user", id: "u1" });

    expect(await service.count(list1)).toBe(1);
    expect(await service.count(list2)).toBe(1);
  });

  test("FIFO: 5 subscribe, 5 pop in order", async () => {
    const { service } = await createE2ESetup();
    const list = defineList({ id: "e2e-fifo" })();

    for (let i = 1; i <= 5; i++) {
      await service.subscribe(list, { type: "user", id: `u${i}` });
    }
    for (let i = 1; i <= 5; i++) {
      const popped = await service.pop(list);
      expect(popped?.actorId).toBe(`u${i}`);
    }
    expect(await service.pop(list)).toBeNull();
  });

  test("invite with referralService: referredBy in metadata", async () => {
    const { service } = await createE2ESetup();
    const referCalls: unknown[] = [];
    const serviceWithReferral = createWaitlistService({
      repo: (await createE2ESetup()).repo,
      referralService: {
        refer: async (...args) => {
          referCalls.push(args);
        },
      },
    });
    const list = defineList({ id: "e2e-invite" })();

    await serviceWithReferral.invite(
      list,
      { type: "user", id: "inviter" },
      { type: "user", id: "invitee" }
    );

    expect(referCalls).toHaveLength(1);
    const entry = (await serviceWithReferral.listSubscribers(list))[0];
    expect(entry?.metadata?.referredBy).toBe("user:inviter");
  });

  test("listSubscribers pagination: 10 entries, limit 3, offset 2", async () => {
    const { service } = await createE2ESetup();
    const list = defineList({ id: "e2e-paginate" })();

    for (let i = 1; i <= 10; i++) {
      await service.subscribe(list, { type: "user", id: `u${i}` });
    }

    const page = await service.listSubscribers(list, { limit: 3, offset: 2 });
    expect(page).toHaveLength(3);
  });

  test("cleanupExpired: removes expired entries", async () => {
    const { repo, service } = await createE2ESetup();
    const list = defineList({ id: "e2e-expire" })();
    const past = new Date(Date.now() - 86400000);

    await service.subscribe(list, { type: "user", id: "e1" }, { expiresAt: past });
    await service.subscribe(list, { type: "user", id: "e2" }, { expiresAt: past });
    await service.subscribe(list, { type: "user", id: "e3" });

    expect(await service.count(list)).toBe(3);

    const removed = await cleanupExpired(repo, list.listKey);
    expect(removed).toBe(2);
    expect(await service.count(list)).toBe(1);
  });
});
