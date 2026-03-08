/**
 * @justwant/config — SourceLookup
 * Lookup descriptor for each source type. Each source interprets its own variant.
 */

export type SourceLookup = { key: string } | { path: string } | { path: string; field?: string };
