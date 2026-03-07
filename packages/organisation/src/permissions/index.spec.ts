import { describe, expect, test } from "bun:test";
import { OrganisationPermissions, OrganisationRealm, OrganisationRoles } from "./index.js";

describe("OrganisationPermissions", () => {
  test("exports atomic permissions with correct ids", () => {
    expect(OrganisationPermissions.organisationRead.id).toBe("organisation:read");
    expect(OrganisationPermissions.organisationUpdate.id).toBe("organisation:update");
    expect(OrganisationPermissions.organisationDelete.id).toBe("organisation:delete");
    expect(OrganisationPermissions.memberInvite.id).toBe("member:invite");
    expect(OrganisationPermissions.settingsView.id).toBe("settings:view");
  });
});

describe("OrganisationRoles", () => {
  test("owner role has all permissions", () => {
    const owner = OrganisationRoles.owner;
    expect(owner.name).toBe("owner");
    expect(owner.resolved.has("organisation:delete")).toBe(true);
  });

  test("viewer role has only read", () => {
    const viewer = OrganisationRoles.viewer;
    expect(viewer.name).toBe("viewer");
    expect(viewer.resolved.has("organisation:read")).toBe(true);
    expect(viewer.resolved.has("organisation:delete")).toBe(false);
  });
});

describe("OrganisationRealm", () => {
  test("has scope name organisation", () => {
    expect(OrganisationRealm.scope.name).toBe("organisation");
  });

  test("permissionById contains all OrganisationPermissions", () => {
    expect(OrganisationRealm.permissionById.get("organisation:read")).toBe(
      OrganisationPermissions.organisationRead
    );
  });

  test("roleByName contains all roles", () => {
    expect(OrganisationRealm.roleByName.get("owner")).toBe(OrganisationRoles.owner);
  });
});
