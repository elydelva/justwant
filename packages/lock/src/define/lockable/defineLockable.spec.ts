import { describe, expect, test } from "bun:test";
import { LockableParamsError } from "../../errors/index.js";
import { defineLockable } from "./defineLockable.js";

describe("defineLockable", () => {
  test("singular lockable returns lockable without params", () => {
    const maintenance = defineLockable({ name: "maintenance", singular: true });
    const lockable = maintenance();
    expect(lockable.type).toBe("maintenance");
    expect(lockable.key).toBe("maintenance");
  });

  test("singular lockable with prefix returns prefixed key", () => {
    const maintenance = defineLockable({
      name: "maintenance",
      singular: true,
      prefix: "app",
    });
    const lockable = maintenance();
    expect(lockable.type).toBe("maintenance");
    expect(lockable.key).toBe("app:maintenance");
  });

  test("plural lockable with string returns lockable with key", () => {
    const order = defineLockable({ name: "order", singular: false });
    const lockable = order("ord_123");
    expect(lockable.type).toBe("order");
    expect(lockable.key).toBe("order:ord_123");
  });

  test("plural lockable with Record returns key with sorted params", () => {
    const order = defineLockable({
      name: "order",
      singular: false,
      prefix: "app",
    });
    const lockable = order({ orgId: "o1", id: "ord1" });
    expect(lockable.type).toBe("order");
    expect(lockable.key).toBe("app:order:id:ord1:orgId:o1");
  });

  test("plural lockable throws when no params provided", () => {
    const order = defineLockable({ name: "order", singular: false });
    expect(() => order()).toThrow(LockableParamsError);
    expect(() => order()).toThrow(/plural lockable/);
  });

  test("singular lockable throws when params provided", () => {
    const maintenance = defineLockable({ name: "maintenance", singular: true });
    expect(() => maintenance("x")).toThrow(LockableParamsError);
    expect(() => maintenance({ id: "x" })).toThrow(/singular/);
  });
});
