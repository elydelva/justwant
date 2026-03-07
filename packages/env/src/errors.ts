export interface EnvIssue {
  key: string;
  message: string;
}

export class EnvironmentError extends Error {
  readonly name = "EnvironmentError";
  readonly issues: readonly EnvIssue[];

  constructor(issues: EnvIssue[]) {
    const lines = issues.map((i) => `  ${i.key}   → ${i.message}`).join("\n");
    super(`${issues.length} invalid environment variable(s)\n\n${lines}`);
    this.issues = issues;
    Object.setPrototypeOf(this, EnvironmentError.prototype);
  }
}

export function formatSchemaIssues(
  key: string,
  issues: ReadonlyArray<{ message?: string }> | undefined
): EnvIssue[] {
  if (!issues || !Array.isArray(issues)) return [];
  return issues.map((issue: { message?: string }) => ({
    key,
    message: typeof issue?.message === "string" ? issue.message : "Invalid",
  }));
}
