/**
 * @justwant/user — defineUser
 * Defines the User identity type. Returns a callable that produces UserRef instances.
 * No parameters — defines "user" as the canonical identity.
 */

import type { UserRef } from "./types/index.js";

export interface UserDef {
  readonly name: "user";
  (id: string): UserRef;
}

export function defineUser(): UserDef {
  const name = "user" as const;

  const userFn = (id: string): UserRef => ({ type: name, id });

  Object.defineProperty(userFn, "name", {
    value: name,
    configurable: true,
  });
  return userFn as UserDef;
}
