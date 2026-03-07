/**
 * @justwant/membership — createMember
 * Defines a member type. Returns a function that produces Member instances.
 */

import type { Member } from "./types/index.js";

export interface CreateMemberOptions<N extends string = string> {
  name: N;
}

export interface MemberDef<N extends string = string> {
  readonly name: N;
  (id: string): Member<N>;
}

export function createMember<N extends string>(options: CreateMemberOptions<N>): MemberDef<N> {
  const { name } = options;

  const memberFn = (id: string): Member<N> => ({ type: name, id });

  Object.defineProperty(memberFn, "name", {
    value: name,
    configurable: true,
  });
  return memberFn as MemberDef<N>;
}
