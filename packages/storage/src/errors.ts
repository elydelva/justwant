/**
 * Parse storage errors into normalized errors.
 */

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = "StorageError";
    Object.setPrototypeOf(this, StorageError.prototype);
  }
}

export class StorageAdapterError extends StorageError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, "ADAPTER", metadata);
    this.name = "StorageAdapterError";
    Object.setPrototypeOf(this, StorageAdapterError.prototype);
  }
}

export function parseStorageError(raw: unknown): StorageError {
  const err = raw as Record<string, unknown>;
  const message = typeof err?.message === "string" ? err.message : String(raw ?? "Unknown error");
  const code = err?.code as string | undefined;

  if (typeof code === "string") {
    switch (code) {
      case "ECONNREFUSED":
      case "ECONNRESET":
        return new StorageAdapterError(message, { code });
      case "ETIMEDOUT":
        return new StorageAdapterError(message, { code });
    }
  }

  return new StorageError(String(message), "UNKNOWN", { original: raw });
}
