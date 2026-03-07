/**
 * @justwant/permission — createActor
 * Defines an actor type (who can act).
 * Infers literal type N from name for build-time type safety.
 */

import type { Actor } from "../../types/index.js";

export interface CreateActorOptions<N extends string = string> {
  name: N;
  within?: string;
}

export interface ActorDef<N extends string = string> {
  readonly name: N;
  readonly within?: string;
  (id: string): Actor<N>;
  (orgId: string, id: string): Actor<N>;
}

export function createActor<N extends string>(options: CreateActorOptions<N>): ActorDef<N> {
  const { name, within } = options;

  const actorDef = ((idOrOrgId?: string, id?: string): Actor<N> => {
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
    throw new Error(`createActor: actor "${name}" requires an id`);
  }) as ActorDef<N>;

  Object.defineProperties(actorDef, {
    name: { value: name, enumerable: true },
    within: { value: within, enumerable: true },
  });

  return actorDef;
}
