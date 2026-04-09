import type { Definable } from "@justwant/meta";
import type { Resource } from "./types.js";

export interface ResourceDef<N extends string = string> extends Definable<N> {
  readonly name: N;
  (id: string): Resource<N>;
}

export function defineResource<N extends string>(options: { name: N }): ResourceDef<N> {
  const { name } = options;
  const resourceDef = ((id: string): Resource<N> => ({ type: name, id })) as ResourceDef<N>;
  Object.defineProperty(resourceDef, "name", { value: name, enumerable: true });
  return resourceDef;
}
