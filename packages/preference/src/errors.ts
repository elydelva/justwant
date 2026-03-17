/**
 * @justwant/preference — Errors
 */

export class PreferenceError extends Error {
  readonly code: string;
  readonly metadata?: Record<string, unknown>;

  constructor(message: string, code = "PREFERENCE_ERROR", metadata?: Record<string, unknown>) {
    super(message);
    this.name = "PreferenceError";
    this.code = code;
    this.metadata = metadata;
  }
}

export class PreferenceValidationError extends PreferenceError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, "PREFERENCE_VALIDATION_ERROR", metadata);
    this.name = "PreferenceValidationError";
  }
}

export class PreferenceNotFoundError extends PreferenceError {
  constructor(
    public readonly key: string,
    metadata?: Record<string, unknown>
  ) {
    super(`Preference not found: ${key}`, "PREFERENCE_NOT_FOUND", {
      ...metadata,
      key,
    });
    this.name = "PreferenceNotFoundError";
  }
}
