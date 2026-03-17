/**
 * @justwant/flag — Errors
 */

export class FlagError extends Error {
  readonly code: string;
  readonly metadata?: Record<string, unknown>;

  constructor(message: string, code = "FLAG_ERROR", metadata?: Record<string, unknown>) {
    super(message);
    this.name = "FlagError";
    this.code = code;
    this.metadata = metadata;
  }
}

export class FlagValidationError extends FlagError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, "FLAG_VALIDATION_ERROR", metadata);
    this.name = "FlagValidationError";
  }
}

export class RuleNotFoundError extends FlagError {
  constructor(
    public readonly ruleId: string,
    metadata?: Record<string, unknown>
  ) {
    super(`Rule not found: ${ruleId}`, "RULE_NOT_FOUND", { ...metadata, ruleId });
    this.name = "RuleNotFoundError";
  }
}
