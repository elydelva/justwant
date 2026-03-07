import { describe, expect, test } from "bun:test";
import { defineMember } from "./defineMember.js";

describe("defineMember", () => {
  test("returns MemberDef with name and callable that produces Member", () => {
    const userMember = defineMember({ name: "user" });

    expect(userMember.name).toBe("user");
    expect(userMember("usr_1")).toEqual({ type: "user", id: "usr_1" });
    expect(userMember("usr_2")).toEqual({ type: "user", id: "usr_2" });
  });

  test("Member type is inferred from name", () => {
    const orgMember = defineMember({ name: "org" });
    const member = orgMember("org_1");

    expect(member.type).toBe("org");
    expect(member.id).toBe("org_1");
  });

  test("accepts different member names", () => {
    const userMember = defineMember({ name: "user" });
    const botMember = defineMember({ name: "bot" });

    expect(userMember("u1").type).toBe("user");
    expect(botMember("b1").type).toBe("bot");
  });
});
