/**
 * @justwant/embedding — Define how to embed an object type.
 */

import type { Embeddable } from "./types.js";

export interface DefineEmbeddableOptions<T> {
  /** Field name on the item that holds the unique id. */
  idField: string;
  /** Reduces item to text for embedding. */
  toText: (item: T) => string;
  /** Optional metadata keys to store alongside the vector. */
  metadataFields?: readonly string[];
}

/**
 * Creates an embeddable definition for a type of object.
 * Describes how to extract id, reduce to text, and which metadata to store.
 */
export function defineEmbeddable<T>(options: DefineEmbeddableOptions<T>): Embeddable<T> {
  const { idField, toText, metadataFields } = options;
  return {
    idField,
    toText,
    metadataFields,
  };
}
