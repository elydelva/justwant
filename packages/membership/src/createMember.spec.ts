import { describe, expect, test } from "bun:test";
import { createMember } from "./createMember.js";

describe("createMember", () => {
  test("returns MemberDef with name and callable that produces Member", () => {
    const userMember = createMember({ name: "user" });

    expect(userMember.name).toBe("user");
    expect(userMember("usr_1")).toEqual({ type: "user", id: "usr_1" });
    expect(userMember("usr_2")).toEqual({ type: "user", id: "usr_2" });
  });

  test("Member type is inferred from name", () => {
    const orgMember = createMember({ name: "org" });
    const member = orgMember("org_1");

    expect(member.type).toBe("org");
    expect(member.id).toBe("org_1");
  });

  test("accepts different member names", () => {
    const userMember = createMember({ name: "user" });
    const botMember = createMember({ name: "bot" });

    expect(userMember("u1").type).toBe("user");
    expect(botMember("b1").type).toBe("bot");
  });
});
