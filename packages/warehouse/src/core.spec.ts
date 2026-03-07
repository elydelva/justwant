import { describe, expect, test } from "bun:test";
import { date, defineContract, number, string, uuid } from "@justwant/contract";
import { createWarehouse, createWarehouseFromSql } from "./core.js";
import { createDuckDbAdapter } from "./duckdb/index.js";

const EventContract = defineContract("events", {
  timestamp: date().required(),
  user_id: uuid().required(),
  event_type: string().required(),
  amount: number().optional(),
});

describe("createWarehouse", () => {
  test("builds warehouse from driver config", async () => {
    const warehouse = createWarehouse(createDuckDbAdapter({ path: ":memory:" }));
    await warehouse.createTable(EventContract);
    const events = warehouse.table(EventContract);
    const rows = await events.query();
    expect(rows).toEqual([]);
  });
});

describe("createWarehouseFromSql", () => {
  test("createTable creates table with DDL", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });

    await adapter.createTable(EventContract);

    const events = adapter.table(EventContract);
    const rows = await events.query();
    expect(rows).toEqual([]);
  });

  test("insert batch and query", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });
    await adapter.createTable(EventContract);

    const events = adapter.table(EventContract);
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
  });

  test("query with where", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });
    await adapter.createTable(EventContract);

    const events = adapter.table(EventContract);
    const ts = new Date();
    await events.insert([
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "purchase", amount: 50 },
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "view" },
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "purchase", amount: 100 },
    ]);

    const purchased = await events.query({ where: { event_type: "purchase" } });
    expect(purchased).toHaveLength(2);
    expect(purchased.every((r) => r.event_type === "purchase")).toBe(true);
  });

  test("query with offset", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });
    await adapter.createTable(EventContract);

    const events = adapter.table(EventContract);
    const ts = new Date();
    await events.insert([
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "a" },
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "b" },
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "c" },
    ]);

    const offset = await events.query({ limit: 2, offset: 1 });
    expect(offset).toHaveLength(2);
  });

  test("query with limit and orderBy", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });
    await adapter.createTable(EventContract);

    const events = adapter.table(EventContract);
    const ts = new Date();
    await events.insert([
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "a" },
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "b" },
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "c" },
    ]);

    const limited = await events.query({ limit: 2 });
    expect(limited).toHaveLength(2);

    const ordered = await events.query({ orderBy: { event_type: "desc" }, limit: 10 });
    expect(ordered[0]?.event_type).toBe("c");
  });

  test("aggregate", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });
    await adapter.createTable(EventContract);

    const events = adapter.table(EventContract);
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
  });

  test("insert empty array does nothing", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });
    await adapter.createTable(EventContract);

    const events = adapter.table(EventContract);
    await events.insert([]);

    const all = await events.query();
    expect(all).toHaveLength(0);
  });

  test("aggregate without groupBy returns single row", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });
    await adapter.createTable(EventContract);

    const events = adapter.table(EventContract);
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
  });

  test("table().createTable() creates table", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });

    const events = adapter.table(EventContract);
    await events.createTable();

    const rows = await events.query();
    expect(rows).toEqual([]);
  });

  test("table().exist() returns true after createTable, false after drop", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });

    const events = adapter.table(EventContract);
    expect(await events.exist()).toBe(false);

    await events.createTable();
    expect(await events.exist()).toBe(true);

    await events.drop();
    expect(await events.exist()).toBe(false);
  });

  test("adapter.createTable(contract) still works for backwards compatibility", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });

    await adapter.createTable(EventContract);
    const events = adapter.table(EventContract);
    const rows = await events.query();
    expect(rows).toEqual([]);
  });

  test("adapter exposes sql and dialect", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });

    expect(adapter.sql).toBe(sql);
    expect(adapter.dialect).toBe("duckdb");
  });
});
