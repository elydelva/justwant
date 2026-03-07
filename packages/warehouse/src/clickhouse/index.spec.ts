import { describe, expect, test } from "bun:test";
import { createClickHouseAdapter } from "./index.js";

describe("createClickHouseAdapter", () => {
  test("returns config with dialect clickhouse", () => {
    const config = createClickHouseAdapter({ connection: "http://localhost:8123" });
    expect(config.dialect).toBe("clickhouse");
    expect(config.sql).toBeDefined();
  });

  test("defaults connection to localhost when not provided", () => {
    const config = createClickHouseAdapter({});
    expect(config.dialect).toBe("clickhouse");
  });
});
