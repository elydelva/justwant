import { describe, expect, test } from "bun:test";
import { createActor } from "./createActor.js";

describe("createActor", () => {
  test("returns actor with id when called with single id", () => {
    const userActor = createActor({ name: "user" });
    const actor = userActor("usr_1");
    expect(actor.type).toBe("user");
    expect(actor.id).toBe("usr_1");
    expect(actor.orgId).toBeUndefined();
  });

  test("returns actor with orgId and id when within and two args", () => {
    const orgMember = createActor({ name: "user", within: "org" });
    const actor = orgMember("org_1", "usr_1");
    expect(actor.type).toBe("user");
    expect(actor.id).toBe("usr_1");
    expect(actor.orgId).toBe("org_1");
  });

  test("throws when no id provided", () => {
    const userActor = createActor({ name: "user" });
    expect(() => (userActor as () => unknown)()).toThrow(/actor "user" requires an id/);
  });

  test("exposes name and within on def", () => {
    const orgMember = createActor({ name: "user", within: "org" });
    expect(orgMember.name).toBe("user");
    expect(orgMember.within).toBe("org");
  });
});
