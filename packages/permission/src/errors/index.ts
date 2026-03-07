/**
 * @justwant/permission — Errors
 */

export class PermissionError extends Error {
  override name = "PermissionError";
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}

export class PermissionDeniedError extends PermissionError {
  override name = "PermissionDeniedError";
  constructor(
    message: string,
    public readonly actorId?: string,
    public readonly permission?: string,
    public readonly scopeId?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, PermissionDeniedError.prototype);
  }
}

export class CeilingViolationError extends PermissionError {
  override name = "CeilingViolationError";
  constructor(
    message: string,
    public readonly requiredRole?: string,
    public readonly actorRole?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, CeilingViolationError.prototype);
  }
}
