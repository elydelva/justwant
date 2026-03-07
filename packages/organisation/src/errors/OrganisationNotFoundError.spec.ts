import { describe, expect, test } from "bun:test";
import { OrganisationNotFoundError } from "./OrganisationNotFoundError.js";

describe("OrganisationNotFoundError", () => {
  test("extends OrganisationError and exposes organisationId", () => {
    const err = new OrganisationNotFoundError("Not found", "org_99");
    expect(err.name).toBe("OrganisationNotFoundError");
    expect(err.organisationId).toBe("org_99");
  });
});
