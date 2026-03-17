import { describe, expect, test } from "bun:test";
import { defineActor } from "./defineActor.js";

describe("defineActor", () => {
  test("returns actor with id when called with id", () => {
    const userActor = defineActor({ name: "user" });
    const actor = userActor("usr_1");
    expect(actor.type).toBe("user");
    expect(actor.id).toBe("usr_1");
    expect(actor.within).toBeUndefined();
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
    const userActor = defineActor({ from: fn as import("./types.js").IdentityLike });
    expect(userActor.name).toBe("user");
    expect(userActor("usr_1")).toEqual({ type: "user", id: "usr_1" });
  });

  test("with within returns actor with within when called with (withinId, id)", () => {
    const userActor = defineActor({ name: "user", within: "org" });
    const actor = userActor("org_1", "usr_1");
    expect(actor.type).toBe("user");
    expect(actor.id).toBe("usr_1");
    expect(actor.within).toEqual({ type: "org", id: "org_1" });
  });

  test("with within exposes within on def", () => {
    const userActor = defineActor({ name: "user", within: "org" });
    expect(userActor.name).toBe("user");
    expect(userActor.within).toBe("org");
  });

  test("with within throws when only one arg provided", () => {
    const userActor = defineActor({ name: "user", within: "org" });
    expect(() => userActor("org_1")).toThrow(/requires \(withinId, id\)/);
  });
});
