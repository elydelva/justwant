import { describe, expect, test } from "bun:test";
import { defineMember } from "@justwant/membership";
import { defineActor } from "@justwant/permission";
import { createStandardOrganisationMembership } from "./createStandardOrganisationMembership.js";
import { createStandardOrganisationPermission } from "./createStandardOrganisationPermission.js";
import { defineOrganisation } from "./defineOrganisation.js";

describe("defineOrganisation", () => {
  test("returns OrgDef with name organisation", () => {
    const member = defineMember({ name: "user" });
    const actor = defineActor({ name: "user" });
    const { group } = createStandardOrganisationMembership({ name: "organisation", member });
    const { realm } = createStandardOrganisationPermission({ name: "organisation", actor });
    const orgDef = defineOrganisation({ name: "organisation", realm, group });
    expect(orgDef.name).toBe("organisation");
  });

  test("callable produces OrgRef with type and id", () => {
    const member = defineMember({ name: "user" });
    const actor = defineActor({ name: "user" });
    const { group } = createStandardOrganisationMembership({ name: "organisation", member });
    const { realm } = createStandardOrganisationPermission({ name: "organisation", actor });
    const orgDef = defineOrganisation({ name: "organisation", realm, group });
    expect(orgDef("org_1")).toEqual({ type: "organisation", id: "org_1" });
    expect(orgDef("org_2")).toEqual({ type: "organisation", id: "org_2" });
  });

  test("returns OrgDef with realm and group", () => {
    const member = defineMember({ name: "user" });
    const actor = defineActor({ name: "user" });
    const { group } = createStandardOrganisationMembership({ name: "tenant", member });
    const { realm } = createStandardOrganisationPermission({ name: "tenant", actor });
    const orgDef = defineOrganisation({ name: "tenant", realm, group });
    expect(orgDef.realm).toBe(realm);
    expect(orgDef.group).toBe(group);
    expect(orgDef.name).toBe("tenant");
  });
});
