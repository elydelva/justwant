import { describe, expect, test } from "bun:test";
import { defineActor } from "@justwant/permission";
import { createStandardOrganisationPermission } from "./createStandardOrganisationPermission.js";

describe("createStandardOrganisationPermission", () => {
  test("returns realm, permissions, and roles with name-derived prefix", () => {
    const actor = defineActor({ name: "user" });
    const result = createStandardOrganisationPermission({ name: "tenant", actor });
    expect(result.realm.name).toBe("tenant");
    expect(result.realm.scope.name).toBe("tenant");
    expect(result.permissions.organisationRead.name).toBe("tenant:read");
    expect(result.permissions.organisationUpdate.name).toBe("tenant:update");
    expect(result.permissions.memberList.name).toBe("member:list");
  });

  test("roles have correct permissions", () => {
    const actor = defineActor({ name: "user" });
    const { roles } = createStandardOrganisationPermission({ name: "tenant", actor });
    expect(roles.owner.resolved.has("tenant:read")).toBe(true);
    expect(roles.owner.resolved.has("tenant:delete")).toBe(true);
    expect(roles.viewer.resolved.has("tenant:read")).toBe(true);
    expect(roles.viewer.resolved.has("tenant:delete")).toBe(false);
  });
});
