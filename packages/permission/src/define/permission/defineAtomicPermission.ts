/**
 * @justwant/permission — defineAtomicPermission
 * Defines an atomic permission. Action is the full string (e.g. "document:read", "billing:view").
 * Optionally linked to a resource type.
 */

import type { Inspectable } from "@justwant/meta";
import type { ReferenceLike } from "../../types/index.js";

export interface AtomicPermission<N extends string = string> extends Inspectable<N> {
  readonly name: N;
  readonly resource?: ReferenceLike;
}

export interface DefineAtomicPermissionOptions<N extends string = string> {
  /** Full permission string (e.g. "document:read", "billing:view") */
  name: N;
  resource?: ReferenceLike;
}

export function defineAtomicPermission<N extends string>(
  options: DefineAtomicPermissionOptions<N>
): AtomicPermission<N> {
  const { name, resource } = options;

  return {
    get name() {
      return name;
    },
    get resource() {
      return resource;
    },
  };
}
