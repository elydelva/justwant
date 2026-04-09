import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { defineList } from "./defineList.js";

describe("defineList", () => {
  test("is callable — returns typed ref", () => {
    const list = defineList({ name: "beta" });
    expect(list("actor-123")).toEqual({ type: "beta", id: "actor-123" });
  });

  test("key() resolves listKey without params", () => {
    const list = defineList({ name: "beta" });
    expect(list.key()).toBe("beta");
  });

  test("key() resolves parameterized listKey", () => {
    const list = defineList({ name: "launch", params: ["productId"] });
    expect(list.key("prod-1")).toBe("launch:prod-1");
  });

  test("key() throws when param count mismatches", () => {
    const list = defineList({ name: "x", params: ["a", "b"] });
    expect(() => list.key("only-one")).toThrow(/expects 2 params/);
  });

  test("exposes schema on definition", () => {
    const schema = v.object({ source: v.string() });
    const list = defineList({ name: "with-schema", schema });
    expect(list.schema).toBe(schema);
  });

  test("exposes name and defaults on definition", () => {
    const list = defineList({ name: "beta", defaults: { limit: 10 } });
    expect(list.name).toBe("beta");
    expect(list.defaults).toEqual({ limit: 10 });
  });
});
