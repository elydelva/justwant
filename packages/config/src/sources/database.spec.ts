import { describe, expect, test } from "bun:test";
import { defineDatabaseSource } from "./database.js";

function createMemoryConfigRepo() {
  const store = new Map<string, unknown>();
  return {
    async findOne(where: { key: string }) {
      const value = store.get(where.key);
      return value !== undefined ? { key: where.key, value } : null;
    },
    set(key: string, value: unknown) {
      store.set(key, value);
    },
  };
}

describe("defineDatabaseSource", () => {
  test("get returns value from repo", async () => {
    const repo = createMemoryConfigRepo();
    repo.set("databaseUrl", "postgres://db");
    const source = defineDatabaseSource({ repo });
    const value = await source.get({ key: "databaseUrl" });
    expect(value).toBe("postgres://db");
  });

  test("get returns undefined for missing key", async () => {
    const repo = createMemoryConfigRepo();
    const source = defineDatabaseSource({ repo });
    const value = await source.get({ key: "missing" });
    expect(value).toBeUndefined();
  });

  test("get returns undefined for path lookup (database uses key only)", async () => {
    const repo = createMemoryConfigRepo();
    repo.set("foo", "bar");
    const source = defineDatabaseSource({ repo });
    const value = await source.get({ path: "foo" });
    expect(value).toBeUndefined();
  });
});
