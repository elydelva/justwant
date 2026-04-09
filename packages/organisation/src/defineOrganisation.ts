/**
 * @justwant/organisation — defineOrganisation
 * Defines an organisation type with realm and group. Returns OrgDef for use with createOrganisationService.
 */

import type { GroupDef } from "@justwant/membership";
import type { Definable } from "@justwant/meta";
import type { RealmDef } from "@justwant/permission";
import type { OrgRef } from "./types/index.js";

export interface DefineOrganisationOptions<N extends string = string> {
  name: N;
  realm: RealmDef;
  group: GroupDef<N>;
}

export interface OrgDef<N extends string = string> extends Definable<N> {
  readonly name: N;
  readonly realm: RealmDef;
  readonly group: GroupDef<N>;
  (id: string): OrgRef<N>;
}

export function defineOrganisation<N extends string>(
  options: DefineOrganisationOptions<N>
): OrgDef<N> {
  const { name, realm, group } = options;

  const orgFn = (id: string): OrgRef<N> => ({ type: name, id });

  Object.defineProperty(orgFn, "name", {
    value: name,
    configurable: true,
  });
  Object.defineProperty(orgFn, "realm", {
    value: realm,
    configurable: true,
  });
  Object.defineProperty(orgFn, "group", {
    value: group,
    configurable: true,
  });
  return orgFn as OrgDef<N>;
}
