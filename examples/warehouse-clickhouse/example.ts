/**
 * Exemple complet : @justwant/warehouse avec ClickHouse
 *
 * bun add @justwant/warehouse @justwant/contract waddler @clickhouse/client
 * bun run examples/warehouse-clickhouse/example.ts
 *
 * Nécessite une instance ClickHouse (ex: docker run -d -p 8123:8123 clickhouse/clickhouse-server)
 */

import { date, defineContract, number, string, uuid } from "@justwant/contract";
import { createWarehouse } from "@justwant/warehouse";
import { createClickHouseAdapter } from "@justwant/warehouse/clickhouse";

const EventContract = defineContract("events", {
  timestamp: date().required(),
  user_id: uuid().required(),
  event_type: string().required(),
  amount: number().optional(),
});

async function main() {
  const warehouse = createWarehouse(
    createClickHouseAdapter({
      connection: process.env.CLICKHOUSE_URL ?? "http://localhost:8123",
    })
  );
  const events = warehouse.table(EventContract);
  await events.createTable();
  const ts = new Date();

  await events.insert([
    { timestamp: ts, user_id: crypto.randomUUID(), event_type: "purchase", amount: 99 },
    { timestamp: ts, user_id: crypto.randomUUID(), event_type: "view" },
  ]);

  const rows = await events.query({ where: { event_type: "purchase" }, limit: 100 });
  console.log("Rows:", rows);

  const agg = await events.aggregate<{ event_type: string; total: number; count: number }>({
    groupBy: ["event_type"],
    select: { total: "sum(amount)", count: "count()" },
  });
  console.log("Aggregation:", agg);
}

main();
