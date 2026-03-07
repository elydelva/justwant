import { describe, expect, test } from "bun:test";
import { createResource } from "../resource/createResource.js";
import { createAtomicPermission } from "./createAtomicPermission.js";

describe("createAtomicPermission", () => {
  test("creates permission with domain and action", () => {
    const perm = createAtomicPermission({
      domain: "document",
      action: "read",
    });
    expect(perm.id).toBe("document:read");
    expect(perm.domain).toBe("document");
    expect(perm.action).toBe("read");
    expect(perm.resource).toBeUndefined();
  });

  test("creates permission with optional resource", () => {
    const documentResource = createResource({ name: "document" });
    const perm = createAtomicPermission({
      domain: "document",
      action: "read",
      resource: documentResource,
    });
    expect(perm.id).toBe("document:read");
    expect(perm.resource).toBe(documentResource);
  });
});
