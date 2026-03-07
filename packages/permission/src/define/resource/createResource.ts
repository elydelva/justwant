/**
 * @justwant/permission — createResource
 * Defines a resource type (what a permission can apply to).
 */

import type { Resource } from "../../types/index.js";

export interface CreateResourceOptions {
  name: string;
}

export interface ResourceDef {
  readonly name: string;
  (id: string): Resource;
}

export function createResource(options: CreateResourceOptions): ResourceDef {
  const { name } = options;

  const resourceDef = ((id?: string): Resource => {
    if (id !== undefined) {
      return {
        type: name,
        id,
      };
    }
    throw new Error(`createResource: resource "${name}" requires an id`);
  }) as ResourceDef;

  Object.defineProperty(resourceDef, "name", { value: name, enumerable: true });

  return resourceDef;
}
