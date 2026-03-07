import { describe, expect, test } from "bun:test";
import { createActor } from "./createActor.js";

describe("createActor", () => {
  test("returns actor with id when called with id", () => {
    const userActor = createActor({ name: "user" });
    const actor = userActor("usr_1");
    expect(actor.type).toBe("user");
    expect(actor.id).toBe("usr_1");
  });

  test("throws when no id provided", () => {
    const userActor = createActor({ name: "user" });
    expect(() => (userActor as () => unknown)()).toThrow(/actor "user" requires an id/);
  });

  test("exposes name on def", () => {
    const userActor = createActor({ name: "user" });
    expect(userActor.name).toBe("user");
  });
});
