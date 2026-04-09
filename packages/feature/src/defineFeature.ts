import type { Definable } from "@justwant/meta";
import type { Feature } from "./types.js";

export interface FeatureDef<N extends string = string> extends Definable<N> {
  readonly name: N;
  (id: string): Feature<N>;
}

export function defineFeature<N extends string>(options: { name: N }): FeatureDef<N> {
  const { name } = options;
  const featureDef = ((id: string): Feature<N> => ({ type: name, id })) as FeatureDef<N>;
  Object.defineProperty(featureDef, "name", { value: name, enumerable: true });
  return featureDef;
}
