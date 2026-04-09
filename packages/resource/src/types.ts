import type { RefLike } from "@justwant/meta";

/** Resource — canonical resource reference. */
export interface Resource<T extends string = string> extends RefLike<T> {}
