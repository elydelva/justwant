/**
 * @justwant/config — defineJsonSource
 * Source that reads from a JSON file (or object). Uses dot notation for path.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ConfigSource, SourceLookup } from "../types/index.js";

export interface DefineJsonSourceOptions {
  /** Path to JSON file */
  path?: string;
  /** Or inline object (takes precedence if both provided) */
  data?: Record<string, unknown>;
  /** CWD for resolving path (default: process.cwd()) */
  cwd?: string;
}

function get(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function loadData(options: DefineJsonSourceOptions): Record<string, unknown> {
  if (options.data) return options.data;
  if (!options.path) return {};
  const cwd = options.cwd ?? (typeof process !== "undefined" ? process.cwd() : ".");
  const fullPath = resolve(cwd, options.path);
  const content = readFileSync(fullPath, "utf-8");
  return JSON.parse(content) as Record<string, unknown>;
}

export function defineJsonSource(options: DefineJsonSourceOptions = {}): ConfigSource {
  let data: Record<string, unknown> | null = null;

  function getData(): Record<string, unknown> {
    if (data === null) data = loadData(options);
    return data;
  }

  return {
    get(lookup: SourceLookup): unknown {
      if (!("path" in lookup)) return undefined;
      const obj = getData();
      return get(obj, lookup.path);
    },
  };
}
