/**
 * @justwant/permission — createPermissionDomain
 * Optional helper to create multiple permissions for a domain.
 */

import type { ResourceDef } from "../resource/createResource.js";
import { createAtomicPermission } from "./createAtomicPermission.js";
import type { AtomicPermission } from "./createAtomicPermission.js";

export interface PermissionDomain {
  permission(action: string): AtomicPermission;
}

export function createPermissionDomain(domain: string, resource?: ResourceDef): PermissionDomain {
  return {
    permission(action: string) {
      return createAtomicPermission({
        domain,
        action,
        resource,
      });
    },
  };
}
