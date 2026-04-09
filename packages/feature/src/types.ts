import type { RefLike } from "@justwant/meta";

/** Feature — canonical feature reference. */
export interface Feature<T extends string = string> extends RefLike<T> {}
