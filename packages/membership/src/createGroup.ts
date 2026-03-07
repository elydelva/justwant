/**
 * @justwant/membership — createGroup
 * Defines a group type with the member type it accepts.
 * Returns a function that produces Group instances.
 */

import type { MemberDef } from "./createMember.js";
import type { Group } from "./types/index.js";

export interface CreateGroupOptions<N extends string = string> {
  name: N;
  member: MemberDef;
}

export interface GroupDef<N extends string = string> {
  readonly name: N;
  readonly member: MemberDef;
  (id: string): Group<N>;
}

export function createGroup<N extends string>(options: CreateGroupOptions<N>): GroupDef<N> {
  const { name, member } = options;

  const groupFn = (id: string): Group<N> => ({ type: name, id });

  Object.defineProperty(groupFn, "name", {
    value: name,
    configurable: true,
  });
  Object.defineProperty(groupFn, "member", {
    value: member,
    configurable: true,
  });
  return groupFn as GroupDef<N>;
}
