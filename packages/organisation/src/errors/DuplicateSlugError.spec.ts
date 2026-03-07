import { describe, expect, test } from "bun:test";
import { DuplicateSlugError } from "./DuplicateSlugError.js";

describe("DuplicateSlugError", () => {
  test("extends OrganisationError and exposes slug", () => {
    const err = new DuplicateSlugError("Duplicate", "acme");
    expect(err.name).toBe("DuplicateSlugError");
    expect(err.slug).toBe("acme");
  });
});
