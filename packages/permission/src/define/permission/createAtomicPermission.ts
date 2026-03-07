/**
 * @justwant/permission — createAtomicPermission
 * Defines an atomic permission (domain:action). Optionally linked to a resource type.
 */

import type { ResourceDef } from "../resource/createResource.js";

export interface AtomicPermission {
  readonly id: string;
  readonly domain: string;
  readonly action: string;
  readonly resource?: ResourceDef;
}

export interface CreateAtomicPermissionOptions {
  domain: string;
  action: string;
  resource?: ResourceDef;
}

export function createAtomicPermission(options: CreateAtomicPermissionOptions): AtomicPermission {
  const { domain, action, resource } = options;
  const id = `${domain}:${action}`;

  return {
    get id() {
      return id;
    },
    get domain() {
      return domain;
    },
    get action() {
      return action;
    },
    get resource() {
      return resource;
    },
  };
}
