export class CacheError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = "CacheError";
    Object.setPrototypeOf(this, CacheError.prototype);
  }
}

export class CacheAdapterError extends CacheError {
  constructor(
    message: string,
    public readonly cause?: unknown,
    metadata?: Record<string, unknown>
  ) {
    super(message, "ADAPTER_ERROR", { ...metadata, cause });
    this.name = "CacheAdapterError";
    Object.setPrototypeOf(this, CacheAdapterError.prototype);
  }
}
