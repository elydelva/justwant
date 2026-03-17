/**
 * @justwant/actor — Canonical Actor type and utilities
 * No storage, agnostic. defineActor, actorKey, toRepo, parseActorKey.
 */

export { defineActor } from "./defineActor.js";
export type {
  DefineActorOptions,
  DefineActorOptionsWithName,
  DefineActorOptionsWithWithin,
  DefineActorOptionsWithFrom,
  ActorDef,
} from "./defineActor.js";

export { actorKey, toRepo, fromRepo, parseActorKey } from "./actorKey.js";
export type { RepoShape, RepoShapeInput } from "./actorKey.js";

export type { Actor, ActorWithin, IdentityLike } from "./types.js";
