import { describe, expect, test } from "bun:test";
import { defineMember } from "@justwant/membership";
import { createStandardOrganisationMembership } from "./createStandardOrganisationMembership.js";

describe("createStandardOrganisationMembership", () => {
  test("returns member and group with name derived from org type", () => {
    const member = defineMember({ name: "user" });
    const result = createStandardOrganisationMembership({ name: "tenant", member });
    expect(result.member).toBe(member);
    expect(result.group.name).toBe("tenant");
    expect(result.group.member).toBe(member);
  });

  test("group callable produces Group with type and id", () => {
    const member = defineMember({ name: "user" });
    const { group } = createStandardOrganisationMembership({ name: "workspace", member });
    expect(group("ws_1")).toEqual({ type: "workspace", id: "ws_1" });
  });
});
