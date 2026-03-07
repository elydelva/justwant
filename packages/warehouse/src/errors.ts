/**
 * Parse warehouse (ClickHouse, DuckDB) errors into normalized errors.
 */

export class WarehouseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = "WarehouseError";
    Object.setPrototypeOf(this, WarehouseError.prototype);
  }
}

export class WarehouseConnectionError extends WarehouseError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, "CONNECTION", metadata);
    this.name = "WarehouseConnectionError";
    Object.setPrototypeOf(this, WarehouseConnectionError.prototype);
  }
}

export class WarehouseTimeoutError extends WarehouseError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, "TIMEOUT", metadata);
    this.name = "WarehouseTimeoutError";
    Object.setPrototypeOf(this, WarehouseTimeoutError.prototype);
  }
}

export function parseWarehouseError(raw: unknown): WarehouseError {
  const err = raw as Record<string, unknown>;
  const message = typeof err?.message === "string" ? err.message : String(raw ?? "Unknown error");
  const causeMsg =
    typeof (err?.cause as { message?: string })?.message === "string"
      ? (err.cause as { message: string }).message
      : "";
  const msgToCheck = causeMsg || message;
  const code = err?.code as string | undefined;

  if (typeof code === "string") {
    switch (code) {
      case "ECONNREFUSED":
      case "ECONNRESET":
        return new WarehouseConnectionError(message, { code });
      case "ETIMEDOUT":
        return new WarehouseTimeoutError(message, { code });
    }
  }

  return new WarehouseError(String(message), "UNKNOWN", { original: raw });
}
