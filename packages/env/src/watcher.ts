import { watch } from "node:fs";
import { join } from "node:path";
import { loadEnvFile } from "./parser.js";

export function watchEnvFiles(
  cwd: string,
  files: string[],
  onChange: (changed: string[]) => void
): () => void {
  const watchers: ReturnType<typeof watch>[] = [];
  let prevValues: Record<string, string> = {};

  function loadAll(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const f of files) {
      const loaded = loadEnvFile(f, cwd);
      for (const [k, v] of Object.entries(loaded)) {
        out[k] = v;
      }
    }
    return out;
  }

  prevValues = loadAll();

  for (const f of files) {
    const fp = join(cwd, f);
    try {
      const w = watch(fp, () => {
        const next = loadAll();
        const changed: string[] = [];
        for (const k of new Set([...Object.keys(prevValues), ...Object.keys(next)])) {
          if (prevValues[k] !== next[k]) changed.push(k);
        }
        prevValues = next;
        if (changed.length) onChange(changed);
      });
      watchers.push(w);
    } catch {
      // File may not exist
    }
  }

  return () => {
    for (const w of watchers) {
      w.close();
    }
  };
}
