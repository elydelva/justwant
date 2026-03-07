import { describe, expect, test } from "bun:test";
import { OrganisationError } from "./OrganisationError.js";

describe("OrganisationError", () => {
  test("has name OrganisationError", () => {
    const err = new OrganisationError("test");
    expect(err.name).toBe("OrganisationError");
    expect(err.message).toBe("test");
  });
});
