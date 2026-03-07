/**
 * @justwant/permission — defineActor
 * Defines an actor type (who can act).
 * Accepts { name } or { from: IdentityLike } for composition with UserDef, etc.
 */

import type { IdentityLike } from "../../types/index.js";
import type { Actor } from "../../types/index.js";

export interface DefineActorOptionsWithName<N extends string = string> {
  name: N;
}

export interface DefineActorOptionsWithFrom {
  from: IdentityLike;
}

export type DefineActorOptions<N extends string = string> =
  | DefineActorOptionsWithName<N>
  | DefineActorOptionsWithFrom;

export interface ActorDef<N extends string = string> {
  readonly name: N;
  (id: string): Actor<N>;
}

function createActorFromName<N extends string>(name: N): ActorDef<N> {
  const actorDef = ((id?: string): Actor<N> => {
    if (id !== undefined) {
      return { type: name, id };
    }
    throw new Error(`defineActor: actor "${name}" requires an id`);
  }) as ActorDef<N>;
  Object.defineProperty(actorDef, "name", { value: name, enumerable: true });
  return actorDef;
}

export function defineActor<N extends string>(options: DefineActorOptions<N>): ActorDef<N> {
  if ("from" in options) {
    const from = options.from;
    const actorDef = ((id: string) => from(id) as Actor<N>) as ActorDef<N>;
    Object.defineProperty(actorDef, "name", {
      value: from.name,
      enumerable: true,
    });
    return actorDef;
  }
  return createActorFromName(options.name);
}
