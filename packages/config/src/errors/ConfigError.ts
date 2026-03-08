/**
 * @justwant/config — ConfigError
 */

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class ConfigValidationError extends ConfigError {
  readonly issues: { key: string; message: string }[];

  constructor(issues: { key: string; message: string }[]) {
    const msg = issues.map((i) => `${i.key}: ${i.message}`).join("; ");
    super(msg);
    this.name = "ConfigValidationError";
    this.issues = issues;
  }
}
