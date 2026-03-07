/**
 * @justwant/permission — createResource
 * Defines a resource type (what a permission can apply to).
 */

import type { Resource } from "../../types/index.js";

export interface CreateResourceOptions {
  name: string;
  within?: string;
}

export interface ResourceDef {
  readonly name: string;
  readonly within?: string;
  (id: string): Resource;
  (orgId: string, id: string): Resource;
}

export function createResource(options: CreateResourceOptions): ResourceDef {
  const { name, within } = options;

  const resourceDef = ((idOrOrgId?: string, id?: string): Resource => {
    if (within && idOrOrgId !== undefined && id !== undefined) {
      return {
        type: name,
        id,
        orgId: idOrOrgId,
      };
    }
    if (idOrOrgId !== undefined) {
      return {
        type: name,
        id: idOrOrgId,
      };
    }
    throw new Error(`createResource: resource "${name}" requires an id`);
  }) as ResourceDef;

  Object.defineProperties(resourceDef, {
    name: { value: name, enumerable: true },
    within: { value: within, enumerable: true },
  });

  return resourceDef;
}
