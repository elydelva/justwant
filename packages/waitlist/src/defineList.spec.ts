import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { defineList } from "./defineList.js";

describe("defineList", () => {
  test("creates list definition without params", () => {
    const list = defineList({ id: "beta" });
    expect(list.id).toBe("beta");
    const resolved = list();
    expect(resolved.listKey).toBe("beta");
  });

  test("creates parameterized list", () => {
    const list = defineList({ id: "launch", params: ["productId"] });
    const resolved = list("prod-1");
    expect(resolved.listKey).toBe("launch:prod-1");
  });

  test("throws when param count mismatches", () => {
    const list = defineList({ id: "x", params: ["a", "b"] });
    expect(() => list("only-one")).toThrow(/expects 2 params/);
  });

  test("exposes schema on definition", () => {
    const schema = v.object({ source: v.string() });
    const list = defineList({ id: "with-schema", schema });
    expect(list.schema).toBe(schema);
  });

  test("exposes name and defaults on definition", () => {
    const list = defineList({
      id: "named",
      name: "Beta Waitlist",
      defaults: { limit: 10 },
    });
    expect(list.name).toBe("Beta Waitlist");
    expect(list.defaults).toEqual({ limit: 10 });
  });
});
