/**
 * Normalized error hierarchy for all adapters.
 * Agnostic of the underlying implementation (Drizzle, Prisma, custom).
 *
 * @see docs/CONTRACT.md for usage and error codes.
 */

export type ConstraintType = "FOREIGN_KEY" | "UNIQUE" | "NOT_NULL" | "CHECK" | "OTHER";

export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AdapterError";
    Object.setPrototypeOf(this, AdapterError.prototype);
  }
}

export class AdapterNotFoundError extends AdapterError {
  constructor(message: string, metadata?: { table?: string; id?: string }) {
    super(message, "NOT_FOUND", metadata);
    this.name = "AdapterNotFoundError";
    Object.setPrototypeOf(this, AdapterNotFoundError.prototype);
  }
}

export class AdapterConstraintError extends AdapterError {
  constructor(
    message: string,
    public readonly constraintType: ConstraintType,
    metadata?: { table?: string; column?: string; constraint?: string }
  ) {
    super(message, constraintType, metadata);
    this.name = "AdapterConstraintError";
    Object.setPrototypeOf(this, AdapterConstraintError.prototype);
  }
}

export class AdapterForeignKeyViolationError extends AdapterConstraintError {
  constructor(
    message: string,
    metadata?: { table?: string; column?: string; referencedTable?: string }
  ) {
    super(message, "FOREIGN_KEY", metadata);
    this.name = "AdapterForeignKeyViolationError";
    Object.setPrototypeOf(this, AdapterForeignKeyViolationError.prototype);
  }
}

export class AdapterUniqueViolationError extends AdapterConstraintError {
  constructor(
    message: string,
    metadata?: { table?: string; column?: string; constraint?: string }
  ) {
    super(message, "UNIQUE", metadata);
    this.name = "AdapterUniqueViolationError";
    Object.setPrototypeOf(this, AdapterUniqueViolationError.prototype);
  }
}

export class AdapterNotNullViolationError extends AdapterConstraintError {
  constructor(message: string, metadata?: { table?: string; column?: string }) {
    super(message, "NOT_NULL", metadata);
    this.name = "AdapterNotNullViolationError";
    Object.setPrototypeOf(this, AdapterNotNullViolationError.prototype);
  }
}

export class AdapterCheckViolationError extends AdapterConstraintError {
  constructor(message: string, metadata?: { table?: string; constraint?: string }) {
    super(message, "CHECK", metadata);
    this.name = "AdapterCheckViolationError";
    Object.setPrototypeOf(this, AdapterCheckViolationError.prototype);
  }
}

export class AdapterMappingError extends AdapterError {
  constructor(message: string, metadata?: { field?: string; column?: string }) {
    super(message, "MAPPING_ERROR", metadata);
    this.name = "AdapterMappingError";
    Object.setPrototypeOf(this, AdapterMappingError.prototype);
  }
}

export class AdapterUnsupportedError extends AdapterError {
  constructor(message: string, metadata?: { operation?: string; dialect?: string }) {
    super(message, "UNSUPPORTED", metadata);
    this.name = "AdapterUnsupportedError";
    Object.setPrototypeOf(this, AdapterUnsupportedError.prototype);
  }
}

export class AdapterConnectionError extends AdapterError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, "CONNECTION", metadata);
    this.name = "AdapterConnectionError";
    Object.setPrototypeOf(this, AdapterConnectionError.prototype);
  }
}

export class AdapterTransactionError extends AdapterError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, "TRANSACTION", metadata);
    this.name = "AdapterTransactionError";
    Object.setPrototypeOf(this, AdapterTransactionError.prototype);
  }
}

export class AdapterTimeoutError extends AdapterError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, "TIMEOUT", metadata);
    this.name = "AdapterTimeoutError";
    Object.setPrototypeOf(this, AdapterTimeoutError.prototype);
  }
}

export function isAdapterError(err: unknown): err is AdapterError {
  return err instanceof AdapterError;
}
