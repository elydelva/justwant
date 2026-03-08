/**
 * @justwant/config — resolve
 * Waterfall resolution: first non-undefined value from value definitions.
 */

import type { SourceLookup, ValueDef } from "./types/index.js";

function getLookup(def: ValueDef): SourceLookup {
  if ("key" in def) return { key: def.key };
  return "field" in def && def.field ? { path: def.path, field: def.field } : { path: def.path };
}

function getFromSource(source: ValueDef["from"], lookup: SourceLookup): Promise<unknown> | unknown {
  const result = source.get(lookup);
  return result;
}

export async function resolveValue(defs: ValueDef | ValueDef[]): Promise<unknown> {
  const list = Array.isArray(defs) ? defs : [defs];
  for (const def of list) {
    const lookup = getLookup(def);
    const result = getFromSource(def.from, lookup);
    const value = result instanceof Promise ? await result : result;
    if (value !== undefined) return value;
  }
  return undefined;
}
