/**
 * @justwant/actor — Core types
 * Canonical Actor identity. Agnostic of domain (org, team, workspace).
 */

/** Structural interface for composition (UserDef, LockOwnerDef, etc.) */
export interface IdentityLike {
  readonly name: string;
  (id: string): { type: string; id: string };
}

/** Optional locality — "within" which entity this actor is acting. Agnostic. */
export interface ActorWithin {
  type: string;
  id: string;
}

/** Actor — canonical identity. within optional for scoped contexts. */
export interface Actor<T extends string = string> {
  type: T;
  id: string;
  within?: ActorWithin;
}
