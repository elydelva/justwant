import { describe, expect, test } from "bun:test";
import { defineActor } from "./defineActor.js";

describe("defineActor", () => {
  test("returns actor with id when called with id", () => {
    const userActor = defineActor({ name: "user" });
    const actor = userActor("usr_1");
    expect(actor.type).toBe("user");
    expect(actor.id).toBe("usr_1");
  });

  test("throws when no id provided", () => {
    const userActor = defineActor({ name: "user" });
    expect(() => (userActor as () => unknown)()).toThrow(/actor "user" requires an id/);
  });

  test("exposes name on def", () => {
    const userActor = defineActor({ name: "user" });
    expect(userActor.name).toBe("user");
  });

  test("from option delegates to IdentityLike", () => {
    const fn = (id: string) => ({ type: "user" as const, id });
    Object.defineProperty(fn, "name", { value: "user", configurable: true });
    const userActor = defineActor({ from: fn as import("../../types/index.js").IdentityLike });
    expect(userActor.name).toBe("user");
    expect(userActor("usr_1")).toEqual({ type: "user", id: "usr_1" });
  });
});
