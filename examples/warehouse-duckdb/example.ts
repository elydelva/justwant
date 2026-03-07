/**
 * Exemple complet : @justwant/warehouse avec DuckDB
 *
 * bun add @justwant/warehouse @justwant/contract waddler @duckdb/node-api
 * bun run examples/warehouse-duckdb/example.ts
 */

import { date, defineContract, number, string, uuid } from "@justwant/contract";
import { createWarehouse } from "@justwant/warehouse";
import { createDuckDbAdapter } from "@justwant/warehouse/duckdb";

const EventContract = defineContract("events", {
  timestamp: date().required(),
  user_id: uuid().required(),
  event_type: string().required(),
  amount: number().optional(),
});

async function main() {
  const warehouse = createWarehouse(createDuckDbAdapter({ path: ":memory:" }));
  const events = warehouse.table(EventContract);
  await events.createTable();
  const ts = new Date();

  // Insert batch
  await events.insert([
    { timestamp: ts, user_id: crypto.randomUUID(), event_type: "purchase", amount: 99 },
    { timestamp: ts, user_id: crypto.randomUUID(), event_type: "purchase", amount: 50 },
    { timestamp: ts, user_id: crypto.randomUUID(), event_type: "view" },
  ]);

  // Query avec filtres
  const purchased = await events.query({
    where: { event_type: "purchase" },
    orderBy: { amount: "desc" },
    limit: 10,
  });
  console.log("Purchases:", purchased);

  // Agrégation
  const agg = await events.aggregate<{ event_type: string; total: number; count: number }>({
    groupBy: ["event_type"],
    select: { total: "sum(amount)", count: "count()" },
  });
  console.log("Aggregation:", agg);
}

main();
