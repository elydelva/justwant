/**
 * @justwant/actor — Core types
 * Canonical Actor identity. Agnostic of domain (org, team, workspace).
 */

import type { Definable, RefLike } from "@justwant/meta";

/**
 * IdentityLike — structural alias for Definable<string>.
 * Kept for backward compatibility with existing consumers.
 */
export interface IdentityLike extends Definable<string> {}

/** Optional locality — "within" which entity this actor is acting. Agnostic. */
export interface ActorWithin {
  type: string;
  id: string;
}

/** Actor — canonical identity. within optional for scoped contexts. */
export interface Actor<T extends string = string> extends RefLike<T> {
  within?: ActorWithin;
}
