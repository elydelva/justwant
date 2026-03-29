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
  const message = typeof err?.message === "string" ? err.message : typeof raw === "string" ? raw : "Unknown error";
  const cause = err?.cause as Record<string, unknown> | undefined;
  const code = (err?.code ?? cause?.code) as string | undefined;

  if (typeof code === "string") {
    switch (code) {
      case "ECONNREFUSED":
      case "ECONNRESET":
        return new WarehouseConnectionError(message, { code });
      case "ETIMEDOUT":
        return new WarehouseTimeoutError(message, { code });
    }
  }

  return new WarehouseError(message, "UNKNOWN", { original: raw });
}
