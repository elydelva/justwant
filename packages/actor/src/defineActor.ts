/**
 * @justwant/actor — defineActor
 * Defines an actor type (who can act).
 * Accepts { name }, { name, within }, or { from: IdentityLike } for composition.
 */

import type { Actor, ActorWithin, IdentityLike } from "./types.js";

export interface DefineActorOptionsWithName<N extends string = string> {
  name: N;
}

export interface DefineActorOptionsWithWithin<
  N extends string = string,
  W extends string = string,
> {
  name: N;
  within: W;
}

export interface DefineActorOptionsWithFrom {
  from: IdentityLike;
}

export type DefineActorOptions<N extends string = string> =
  | DefineActorOptionsWithName<N>
  | DefineActorOptionsWithWithin<N>
  | DefineActorOptionsWithFrom;

export interface ActorDef<N extends string = string> {
  readonly name: N;
  readonly within?: string;
  (id: string): Actor<N>;
  (withinId: string, id: string): Actor<N>;
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

function createActorWithWithin<N extends string, W extends string>(
  name: N,
  withinType: W
): ActorDef<N> {
  const actorDef = ((withinId: string, id?: string): Actor<N> => {
    if (withinId !== undefined && id !== undefined) {
      const within: ActorWithin = { type: withinType, id: withinId };
      return { type: name, id, within };
    }
    throw new Error(
      `defineActor: actor "${name}" with within "${withinType}" requires (withinId, id)`
    );
  }) as ActorDef<N>;
  Object.defineProperties(actorDef, {
    name: { value: name, enumerable: true },
    within: { value: withinType, enumerable: true },
  });
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
  if ("within" in options && options.within) {
    return createActorWithWithin(options.name, options.within);
  }
  return createActorFromName(options.name);
}
