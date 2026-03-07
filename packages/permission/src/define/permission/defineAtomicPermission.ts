/**
 * @justwant/permission — defineAtomicPermission
 * Defines an atomic permission. Action is the full string (e.g. "document:read", "billing:view").
 * Optionally linked to a resource type.
 */

import type { ReferenceLike } from "../../types/index.js";

export interface AtomicPermission {
  readonly id: string;
  readonly resource?: ReferenceLike;
}

export interface DefineAtomicPermissionOptions {
  /** Full permission string (e.g. "document:read", "billing:view") */
  action: string;
  resource?: ReferenceLike;
}

export function defineAtomicPermission(options: DefineAtomicPermissionOptions): AtomicPermission {
  const { action, resource } = options;
  const id = action;

  return {
    get id() {
      return id;
    },
    get resource() {
      return resource;
    },
  };
}
