import { describe, expect, test } from "bun:test";
import { createResource } from "../resource/createResource.js";
import { createPermissionDomain } from "./createPermissionDomain.js";

describe("createPermissionDomain", () => {
  test("permission returns AtomicPermission with domain and action", () => {
    const documentDomain = createPermissionDomain("document");
    const read = documentDomain.permission("read");
    const write = documentDomain.permission("write");

    expect(read.id).toBe("document:read");
    expect(read.domain).toBe("document");
    expect(read.action).toBe("read");
    expect(read.resource).toBeUndefined();

    expect(write.id).toBe("document:write");
    expect(write.domain).toBe("document");
    expect(write.action).toBe("write");
  });

  test("permission with resource option includes resource on AtomicPermission", () => {
    const documentResource = createResource({ name: "document" });
    const documentDomain = createPermissionDomain("document", documentResource);
    const read = documentDomain.permission("read");

    expect(read.id).toBe("document:read");
    expect(read.resource).toBe(documentResource);
  });
});
