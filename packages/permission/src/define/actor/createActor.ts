/**
 * @justwant/permission — createActor
 * Defines an actor type (who can act).
 * Infers literal type N from name for build-time type safety.
 */

import type { Actor } from "../../types/index.js";

export interface CreateActorOptions<N extends string = string> {
  name: N;
}

export interface ActorDef<N extends string = string> {
  readonly name: N;
  (id: string): Actor<N>;
}

export function createActor<N extends string>(options: CreateActorOptions<N>): ActorDef<N> {
  const { name } = options;

  const actorDef = ((id?: string): Actor<N> => {
    if (id !== undefined) {
      return {
        type: name,
        id,
      };
    }
    throw new Error(`createActor: actor "${name}" requires an id`);
  }) as ActorDef<N>;

  Object.defineProperty(actorDef, "name", { value: name, enumerable: true });

  return actorDef;
}
