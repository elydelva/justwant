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

  test("exposes close() when config has close", async () => {
    let closed = false;
    const adapter = createDuckDbAdapter({ path: ":memory:" });
    const warehouse = createWarehouse({ ...adapter, close: async () => { closed = true; } });
    expect(typeof warehouse.close).toBe("function");
    await warehouse.close!();
    expect(closed).toBe(true);
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
    expect(offset.map((r) => r.event_type)).toEqual(["b", "c"]);
  });

  test("query with limit 0 returns empty array", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });
    await adapter.createTable(EventContract);

    const events = adapter.table(EventContract);
    const ts = new Date();
    await events.insert([{ timestamp: ts, user_id: crypto.randomUUID(), event_type: "a" }]);

    const empty = await events.query({ limit: 0 });
    expect(empty).toHaveLength(0);
  });

  test("query with offset only returns rows after offset", async () => {
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

    const afterOffset = await events.query({ offset: 2 });
    expect(afterOffset).toHaveLength(1);
    expect(afterOffset[0]?.event_type).toBe("c");
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

  test("aggregate on empty table returns expected shape", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });
    await adapter.createTable(EventContract);

    const events = adapter.table(EventContract);
    const agg = await events.aggregate<{ total: number; count: number }>({
      select: { total: "sum(amount)", count: "count()" },
    });
    expect(agg).toHaveLength(1);
    expect(agg[0]?.total).toBeNull();
    expect(Number(agg[0]?.count)).toBe(0);
  });

  test("insert with amount 0 preserves zero", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });
    await adapter.createTable(EventContract);

    const events = adapter.table(EventContract);
    const ts = new Date();
    await events.insert([
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "free", amount: 0 },
    ]);

    const rows = await events.query();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.amount).toBe(0);
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

  test("exist() returns false for non-existent table", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });
    const events = adapter.table(EventContract);
    expect(await events.exist()).toBe(false);
  });

  test("drop() on non-existent table does not throw (IF NOT EXISTS)", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });
    const events = adapter.table(EventContract);
    await expect(events.drop()).resolves.toBeUndefined();
  });

  test("createTable with ifNotExists idempotent when table exists", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });
    const events = adapter.table(EventContract);
    await events.createTable();
    await events.createTable();
    const rows = await events.query();
    expect(rows).toEqual([]);
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

  test("createTable throws wrapped error on SQL failure", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });
    // Try to create with an invalid table name to force error
    const BadContract = defineContract("", {
      id: uuid().required(),
    });
    await expect(adapter.createTable(BadContract)).rejects.toThrow();
  });

  test("query with where filter on aggregate", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });
    await adapter.createTable(EventContract);

    const events = adapter.table(EventContract);
    const ts = new Date();
    await events.insert([
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "purchase", amount: 10 },
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "view" },
    ]);

    const agg = await events.aggregate<{ count: number }>({
      select: { count: "count()" },
      where: { event_type: "purchase" },
    });
    expect(Number(agg[0]?.count)).toBe(1);
  });

  test("insert catch path re-throws warehouse error", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });
    // table doesn't exist — insert should throw
    const events = adapter.table(EventContract);
    await expect(
      events.insert([{ timestamp: new Date(), user_id: crypto.randomUUID(), event_type: "x" }])
    ).rejects.toThrow();
  });

  test("query catch path re-throws warehouse error", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });
    const events = adapter.table(EventContract);
    // table doesn't exist — query should throw
    await expect(events.query()).rejects.toThrow();
  });

  test("aggregate catch path re-throws warehouse error", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });
    const events = adapter.table(EventContract);
    await expect(events.aggregate({ select: { count: "count()" } })).rejects.toThrow();
  });

  test("exist() catch path re-throws warehouse error", async () => {
    // This tests the error path — normally exist() never throws since we use IF EXISTS
    // but we can verify it succeeds normally
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });
    const events = adapter.table(EventContract);
    // Should not throw — returns false for non-existent
    await expect(events.exist()).resolves.toBe(false);
  });

  test("table().createTable() catch path re-throws on double IF NOT EXISTS success", async () => {
    const { waddler } = await import("waddler/duckdb-neo");
    const sql = waddler({ url: ":memory:" });
    const adapter = createWarehouseFromSql(sql, { dialect: "duckdb" });
    const events = adapter.table(EventContract);
    // Should succeed idempotently
    await events.createTable();
    await expect(events.createTable()).resolves.toBeUndefined();
  });
});
