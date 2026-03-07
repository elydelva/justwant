import { describe, expect, test } from "bun:test";
import { date, defineContract, number, string, uuid } from "@justwant/contract";
import { createWarehouse } from "../core.js";
import { createDuckDbAdapter } from "./index.js";

const EventContract = defineContract("events", {
  timestamp: date().required(),
  user_id: uuid().required(),
  event_type: string().required(),
  amount: number().optional(),
});

describe("createDuckDbAdapter", () => {
  test("returns config for createWarehouse and works end-to-end", async () => {
    const warehouse = createWarehouse(createDuckDbAdapter({ path: ":memory:" }));
    await warehouse.createTable(EventContract);

    const events = warehouse.table(EventContract);
    const ts = new Date();
    await events.insert([
      { timestamp: ts, user_id: crypto.randomUUID(), event_type: "purchase", amount: 42 },
    ]);

    const rows = await events.query();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.event_type).toBe("purchase");
    expect(rows[0]?.amount).toBe(42);
  });

  test("returns config with dialect duckdb", () => {
    const config = createDuckDbAdapter({ path: ":memory:" });
    expect(config.dialect).toBe("duckdb");
  });
});
