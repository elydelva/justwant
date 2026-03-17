import { describe, expect, test } from "bun:test";
import { actorKey, fromRepo, parseActorKey, toRepo } from "./actorKey.js";

describe("actorKey", () => {
  test("returns type:id for actor without within", () => {
    expect(actorKey({ type: "user", id: "usr_1" })).toBe("user:usr_1");
  });

  test("returns type:id:withinType:withinId for actor with within", () => {
    expect(actorKey({ type: "user", id: "usr_1", within: { type: "org", id: "org_1" } })).toBe(
      "user:usr_1:org:org_1"
    );
  });

  test("round-trips with parseActorKey", () => {
    const actor = { type: "user", id: "usr_1", within: { type: "team", id: "team_1" } };
    expect(parseActorKey(actorKey(actor))).toEqual(actor);
  });
});

describe("toRepo", () => {
  test("returns actorType and actorId for actor without within", () => {
    const shape = toRepo({ type: "user", id: "usr_1" });
    expect(shape).toEqual({ actorType: "user", actorId: "usr_1" });
  });

  test("returns actorWithinType and actorWithinId when within present", () => {
    const shape = toRepo({
      type: "user",
      id: "usr_1",
      within: { type: "org", id: "org_1" },
    });
    expect(shape).toEqual({
      actorType: "user",
      actorId: "usr_1",
      actorWithinType: "org",
      actorWithinId: "org_1",
      actorOrgId: "org_1",
    });
  });

  test("does not set actorOrgId when within.type is not org", () => {
    const shape = toRepo({
      type: "user",
      id: "usr_1",
      within: { type: "team", id: "team_1" },
    });
    expect(shape.actorOrgId).toBeUndefined();
    expect(shape.actorWithinType).toBe("team");
    expect(shape.actorWithinId).toBe("team_1");
  });
});

describe("parseActorKey", () => {
  test("parses type:id", () => {
    expect(parseActorKey("user:usr_1")).toEqual({ type: "user", id: "usr_1" });
  });

  test("parses type:id:withinType:withinId", () => {
    expect(parseActorKey("user:usr_1:org:org_1")).toEqual({
      type: "user",
      id: "usr_1",
      within: { type: "org", id: "org_1" },
    });
  });

  test("throws for invalid key with too few parts", () => {
    expect(() => parseActorKey("user")).toThrow(/invalid key/);
  });

  test("parses legacy 3-part type:id:orgId as within org", () => {
    expect(parseActorKey("user:usr_1:org_1")).toEqual({
      type: "user",
      id: "usr_1",
      within: { type: "org", id: "org_1" },
    });
  });

  test("throws for invalid key with 1 part", () => {
    expect(() => parseActorKey("user")).toThrow(/invalid key/);
  });
});

describe("fromRepo", () => {
  test("builds Actor from actorWithinType/actorWithinId", () => {
    expect(
      fromRepo({
        actorType: "user",
        actorId: "u1",
        actorWithinType: "team",
        actorWithinId: "t1",
      })
    ).toEqual({
      type: "user",
      id: "u1",
      within: { type: "team", id: "t1" },
    });
  });

  test("builds Actor from legacy actorOrgId", () => {
    expect(
      fromRepo({
        actorType: "user",
        actorId: "u1",
        actorOrgId: "org_1",
      })
    ).toEqual({
      type: "user",
      id: "u1",
      within: { type: "org", id: "org_1" },
    });
  });

  test("builds Actor without within when no context", () => {
    expect(fromRepo({ actorType: "user", actorId: "u1" })).toEqual({
      type: "user",
      id: "u1",
    });
  });

  test("prefers actorWithinType over actorOrgId", () => {
    expect(
      fromRepo({
        actorType: "user",
        actorId: "u1",
        actorOrgId: "org_1",
        actorWithinType: "team",
        actorWithinId: "t1",
      })
    ).toEqual({
      type: "user",
      id: "u1",
      within: { type: "team", id: "t1" },
    });
  });
});
