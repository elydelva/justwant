import { describe, expect, test } from "bun:test";
import { defineResource } from "@justwant/resource";
import { defineAtomicPermission } from "./defineAtomicPermission.js";

describe("defineAtomicPermission", () => {
  test("creates permission with action string", () => {
    const perm = defineAtomicPermission({ name: "document:read" });
    expect(perm.name).toBe("document:read");
    expect(perm.resource).toBeUndefined();
  });

  test("creates permission with optional resource", () => {
    const documentResource = defineResource({ name: "document" });
    const perm = defineAtomicPermission({
      name: "document:read",
      resource: documentResource,
    });
    expect(perm.name).toBe("document:read");
    expect(perm.resource).toBe(documentResource);
  });
});
