/**
 * E2E integration tests with real ClickHouse.
 * Requires: Docker (docker compose up -d in packages/warehouse).
 */
import { describe, expect, test } from "bun:test";
import { date, defineContract, number, string, uuid } from "@justwant/contract";
import { createClickHouseAdapter } from "./clickhouse/index.js";
import { createWarehouse } from "./core.js";
import { CLICKHOUSE_URL, hasClickHouse } from "./e2e-helpers.js";

function createEventContract(tableName: string) {
  return defineContract(tableName, {
    timestamp: date().required(),
    user_id: uuid().required(),
    event_type: string().required(),
    amount: number().optional(),
  });
}

describe("ClickHouse integration", () => {
  test("createWarehouse builds from ClickHouse adapter", async () => {
    if (!(await hasClickHouse())) {
      console.log("Skipping E2E ClickHouse: not available (run: docker compose up -d)");
      return;
    }

    const tableName = `events_e2e_${Date.now()}`;
    const EventContract = createEventContract(tableName);
    const warehouse = createWarehouse(createClickHouseAdapter({ connection: CLICKHOUSE_URL }));
    await warehouse.createTable(EventContract);
    const events = warehouse.table(EventContract);
    const rows = await events.query();
    expect(rows).toEqual([]);
    await events.drop();
  });

  test("insert batch and query", async () => {
    if (!(await hasClickHouse())) {
      console.log("Skipping E2E ClickHouse: not available (run: docker compose up -d)");
      return;
    }

    const tableName = `events_e2e_${Date.now()}`;
    const EventContract = createEventContract(tableName);
    const warehouse = createWarehouse(createClickHouseAdapter({ connection: CLICKHOUSE_URL }));
    await warehouse.createTable(EventContract);
    const events = warehouse.table(EventContract);
    const ts = new Date();
    const uid = crypto.randomUUID();
    await events.insert([
      { timestamp: ts, user_id: uid, event_type: "purchase", amount: 99 },
      { timestamp: ts, user_id: uid, event_type: "view" },
    ]);

    const all = await events.query();
    expect(all).toHaveLength(2);
    expect(all[0]?.event_type).toBe("purchase");
    expect(all[0]?.amount).toBe(99);
    expect(all[1]?.event_type).toBe("view");
    expect(all[1]?.amount).toBeUndefined();
    await events.drop();
  });

  test("query with where", async () => {
    if (!(await hasClickHouse())) {
      console.log("Skipping E2E ClickHouse: not available (run: docker compose up -d)");
      return;
    }

    const tableName = `events_e2e_${Date.now()}`;
    const EventContract = createEventContract(tableName);
    const warehouse = createWarehouse(createClickHouseAdapter({ connection: CLICKHOUSE_URL }));
    await warehouse.createTable(EventContract);
    const events = warehouse.table(EventContract);
    const ts = new Date();
    await events.insert([
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "purchase", amount: 50 },
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "view" },
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "purchase", amount: 100 },
    ]);

    const purchased = await events.query({ where: { event_type: "purchase" } });
    expect(purchased).toHaveLength(2);
    expect(purchased.every((r) => r.event_type === "purchase")).toBe(true);
    await events.drop();
  });

  test("query with limit and offset", async () => {
    if (!(await hasClickHouse())) {
      console.log("Skipping E2E ClickHouse: not available (run: docker compose up -d)");
      return;
    }

    const tableName = `events_e2e_${Date.now()}`;
    const EventContract = createEventContract(tableName);
    const warehouse = createWarehouse(createClickHouseAdapter({ connection: CLICKHOUSE_URL }));
    await warehouse.createTable(EventContract);
    const events = warehouse.table(EventContract);
    const ts = new Date();
    await events.insert([
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "a" },
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "b" },
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "c" },
    ]);

    const limited = await events.query({ limit: 2 });
    expect(limited).toHaveLength(2);

    const offset = await events.query({ limit: 2, offset: 1 });
    expect(offset).toHaveLength(2);
    expect(offset.map((r) => r.event_type)).toEqual(["b", "c"]);
    await events.drop();
  });

  test("query with orderBy", async () => {
    if (!(await hasClickHouse())) {
      console.log("Skipping E2E ClickHouse: not available (run: docker compose up -d)");
      return;
    }

    const tableName = `events_e2e_${Date.now()}`;
    const EventContract = createEventContract(tableName);
    const warehouse = createWarehouse(createClickHouseAdapter({ connection: CLICKHOUSE_URL }));
    await warehouse.createTable(EventContract);
    const events = warehouse.table(EventContract);
    const ts = new Date();
    await events.insert([
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "a" },
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "b" },
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "c" },
    ]);

    const ordered = await events.query({ orderBy: { event_type: "desc" }, limit: 10 });
    expect(ordered[0]?.event_type).toBe("c");
    await events.drop();
  });

  test("aggregate with groupBy", async () => {
    if (!(await hasClickHouse())) {
      console.log("Skipping E2E ClickHouse: not available (run: docker compose up -d)");
      return;
    }

    const tableName = `events_e2e_${Date.now()}`;
    const EventContract = createEventContract(tableName);
    const warehouse = createWarehouse(createClickHouseAdapter({ connection: CLICKHOUSE_URL }));
    await warehouse.createTable(EventContract);
    const events = warehouse.table(EventContract);
    const ts = new Date();
    await events.insert([
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "purchase", amount: 10 },
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "purchase", amount: 20 },
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "view" },
    ]);

    const agg = await events.aggregate<{ event_type: string; total: number; count: number }>({
      groupBy: ["event_type"],
      select: { total: "sum(amount)", count: "count()" },
    });

    expect(agg).toHaveLength(2);
    const purchaseRow = agg.find((r) => r.event_type === "purchase");
    expect(Number(purchaseRow?.total)).toBe(30);
    expect(Number(purchaseRow?.count)).toBe(2);
    await events.drop();
  });

  test("aggregate without groupBy", async () => {
    if (!(await hasClickHouse())) {
      console.log("Skipping E2E ClickHouse: not available (run: docker compose up -d)");
      return;
    }

    const tableName = `events_e2e_${Date.now()}`;
    const EventContract = createEventContract(tableName);
    const warehouse = createWarehouse(createClickHouseAdapter({ connection: CLICKHOUSE_URL }));
    await warehouse.createTable(EventContract);
    const events = warehouse.table(EventContract);
    const ts = new Date();
    await events.insert([
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "purchase", amount: 10 },
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "purchase", amount: 20 },
    ]);

    const agg = await events.aggregate<{ total: number; count: number }>({
      select: { total: "sum(amount)", count: "count()" },
    });
    expect(agg).toHaveLength(1);
    expect(agg[0]?.total).toBe(30);
    expect(agg[0]?.count).toBe(2);
    await events.drop();
  });

  test("insert empty array does nothing", async () => {
    if (!(await hasClickHouse())) {
      console.log("Skipping E2E ClickHouse: not available (run: docker compose up -d)");
      return;
    }

    const tableName = `events_e2e_${Date.now()}`;
    const EventContract = createEventContract(tableName);
    const warehouse = createWarehouse(createClickHouseAdapter({ connection: CLICKHOUSE_URL }));
    await warehouse.createTable(EventContract);
    const events = warehouse.table(EventContract);
    await events.insert([]);

    const all = await events.query();
    expect(all).toHaveLength(0);
    await events.drop();
  });

  test("table().createTable() creates table", async () => {
    if (!(await hasClickHouse())) {
      console.log("Skipping E2E ClickHouse: not available (run: docker compose up -d)");
      return;
    }

    const tableName = `events_e2e_${Date.now()}`;
    const EventContract = createEventContract(tableName);
    const warehouse = createWarehouse(createClickHouseAdapter({ connection: CLICKHOUSE_URL }));
    const events = warehouse.table(EventContract);
    await events.createTable();

    const rows = await events.query();
    expect(rows).toEqual([]);
    await events.drop();
  });

  test("table().exist() returns true after createTable, false after drop", async () => {
    if (!(await hasClickHouse())) {
      console.log("Skipping E2E ClickHouse: not available (run: docker compose up -d)");
      return;
    }

    const tableName = `events_e2e_${Date.now()}`;
    const EventContract = createEventContract(tableName);
    const warehouse = createWarehouse(createClickHouseAdapter({ connection: CLICKHOUSE_URL }));
    const events = warehouse.table(EventContract);
    expect(await events.exist()).toBe(false);

    await events.createTable();
    expect(await events.exist()).toBe(true);

    await events.drop();
    expect(await events.exist()).toBe(false);
  });

  test("query with limit 0 returns empty array", async () => {
    if (!(await hasClickHouse())) {
      console.log("Skipping E2E ClickHouse: not available (run: docker compose up -d)");
      return;
    }

    const tableName = `events_e2e_${Date.now()}`;
    const EventContract = createEventContract(tableName);
    const warehouse = createWarehouse(createClickHouseAdapter({ connection: CLICKHOUSE_URL }));
    await warehouse.createTable(EventContract);
    const events = warehouse.table(EventContract);
    const ts = new Date();
    await events.insert([{ timestamp: ts, user_id: crypto.randomUUID(), event_type: "a" }]);

    const empty = await events.query({ limit: 0 });
    expect(empty).toHaveLength(0);
    await events.drop();
  });

  test("aggregate on empty table returns expected shape", async () => {
    if (!(await hasClickHouse())) {
      console.log("Skipping E2E ClickHouse: not available (run: docker compose up -d)");
      return;
    }

    const tableName = `events_e2e_${Date.now()}`;
    const EventContract = createEventContract(tableName);
    const warehouse = createWarehouse(createClickHouseAdapter({ connection: CLICKHOUSE_URL }));
    await warehouse.createTable(EventContract);
    const events = warehouse.table(EventContract);

    const agg = await events.aggregate<{ total: number; count: number }>({
      select: { total: "sum(amount)", count: "count()" },
    });
    expect(agg).toHaveLength(1);
    expect(agg[0]?.total).toBeNull();
    expect(Number(agg[0]?.count)).toBe(0);
    await events.drop();
  });

  test("insert with amount 0 preserves zero", async () => {
    if (!(await hasClickHouse())) {
      console.log("Skipping E2E ClickHouse: not available (run: docker compose up -d)");
      return;
    }

    const tableName = `events_e2e_${Date.now()}`;
    const EventContract = createEventContract(tableName);
    const warehouse = createWarehouse(createClickHouseAdapter({ connection: CLICKHOUSE_URL }));
    await warehouse.createTable(EventContract);
    const events = warehouse.table(EventContract);
    const ts = new Date();
    await events.insert([
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "free", amount: 0 },
    ]);

    const rows = await events.query();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.amount).toBe(0);
    await events.drop();
  });

  test("drop() on non-existent table does not throw", async () => {
    if (!(await hasClickHouse())) {
      console.log("Skipping E2E ClickHouse: not available (run: docker compose up -d)");
      return;
    }

    const tableName = `events_e2e_nonexistent_${Date.now()}`;
    const EventContract = createEventContract(tableName);
    const warehouse = createWarehouse(createClickHouseAdapter({ connection: CLICKHOUSE_URL }));
    const events = warehouse.table(EventContract);
    await expect(events.drop()).resolves.toBeUndefined();
  });
});
