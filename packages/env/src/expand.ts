/**
 * Expand ${VAR} and ${VAR:-default} in string values.
 */
export function expandVars(value: string, vars: Record<string, string | undefined>): string {
  return value.replace(/\$\{([^}:]+)(?::-([^}]*))?\}/g, (_, name: string, def?: string) => {
    const v = vars[name];
    if (v !== undefined && v !== "") return v;
    return def ?? "";
  });
}

export function expandRecord(
  record: Record<string, string>,
  expand: boolean
): Record<string, string> {
  if (!expand) return { ...record };
  const vars: Record<string, string> = { ...record };
  let changed = true;
  let iterations = 0;
  const maxIterations = 10; // Prevent infinite loops from circular refs

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    for (const k of Object.keys(vars)) {
      const v = vars[k];
      if (v === undefined) continue;
      const expanded = expandVars(v, vars);
      if (expanded !== v) {
        changed = true;
        vars[k] = expanded;
      }
    }
  }

  return vars;
}
