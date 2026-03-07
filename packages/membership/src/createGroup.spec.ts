import { describe, expect, test } from "bun:test";
import { createGroup } from "./createGroup.js";
import { createMember } from "./createMember.js";

describe("createGroup", () => {
  test("returns GroupDef with name, member, and callable that produces Group", () => {
    const userMember = createMember({ name: "user" });
    const orgGroup = createGroup({ name: "org", member: userMember });

    expect(orgGroup.name).toBe("org");
    expect(orgGroup.member).toBe(userMember);
    expect(orgGroup("org_1")).toEqual({ type: "org", id: "org_1" });
    expect(orgGroup("org_2")).toEqual({ type: "org", id: "org_2" });
  });

  test("Group type is inferred from name", () => {
    const userMember = createMember({ name: "user" });
    const groupGroup = createGroup({ name: "group", member: userMember });
    const group = groupGroup("grp_1");

    expect(group.type).toBe("group");
    expect(group.id).toBe("grp_1");
  });

  test("accepts different group names and member types", () => {
    const userMember = createMember({ name: "user" });
    const orgGroup = createGroup({ name: "org", member: userMember });
    const teamGroup = createGroup({ name: "team", member: userMember });

    expect(orgGroup("o1").type).toBe("org");
    expect(teamGroup("t1").type).toBe("team");
    expect(orgGroup.member.name).toBe("user");
  });
});
