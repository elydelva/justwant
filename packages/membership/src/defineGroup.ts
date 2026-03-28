/**
 * @justwant/membership — defineGroup
 * Defines a group type with the member type it accepts.
 * Returns a function that produces Group instances.
 */

import type { Group, MemberLike } from "./types/index.js";

export interface DefineGroupOptions<N extends string = string> {
  name: N;
  member: MemberLike;
}

export interface GroupDef<N extends string = string> {
  readonly name: N;
  readonly member: MemberLike;
  (id: string): Group<N>;
}

export function defineGroup<N extends string>(options: DefineGroupOptions<N>): GroupDef<N> {
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
