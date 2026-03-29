/**
 * Parse Prisma errors into normalized adapter errors.
 * Covers PrismaClientKnownRequestError, PrismaClientValidationError,
 * PrismaClientInitializationError, and PrismaClientRustPanicError.
 */

import {
  AdapterCheckViolationError,
  AdapterConnectionError,
  AdapterError,
  AdapterForeignKeyViolationError,
  AdapterMappingError,
  AdapterNotFoundError,
  AdapterNotNullViolationError,
  AdapterTimeoutError,
  AdapterTransactionError,
  AdapterUniqueViolationError,
  AdapterUnsupportedError,
} from "@justwant/db/errors";
import { str } from "../utils.js";

function getMessage(err: unknown): string {
  const e = err as Record<string, unknown>;
  const fallback = typeof err === "string" ? err : "Unknown error";
  return typeof e?.message === "string" ? e.message : fallback;
}

function getCode(err: unknown): string | undefined {
  return (err as Record<string, unknown>)?.code as string | undefined;
}

function getMeta(err: unknown): Record<string, unknown> | undefined {
  return (err as Record<string, unknown>)?.meta as Record<string, unknown> | undefined;
}

function getErrorCode(err: unknown): string | undefined {
  return (err as Record<string, unknown>)?.errorCode as string | undefined;
}

function isPrismaError(err: unknown, name: string): boolean {
  const e = err as Record<string, unknown>;
  return e?.name === name || (e?.constructor as { name?: string })?.name === name;
}

/**
 * Maps Prisma errors to normalized AdapterError subclasses.
 * Supports all PrismaClientKnownRequestError codes and other Prisma error types.
 */
export function parsePrismaError(raw: unknown): AdapterError {
  const message = getMessage(raw);
  const code = getCode(raw);
  const meta = getMeta(raw);
  const errorCode = getErrorCode(raw);

  // PrismaClientValidationError — incorrect types, missing fields
  if (isPrismaError(raw, "PrismaClientValidationError")) {
    return new AdapterMappingError(message, { field: "validation" });
  }

  // PrismaClientInitializationError — connection, engine startup
  if (isPrismaError(raw, "PrismaClientInitializationError")) {
    return new AdapterConnectionError(message, { code: errorCode ?? "INIT", original: raw });
  }

  // PrismaClientRustPanicError — engine crash
  if (isPrismaError(raw, "PrismaClientRustPanicError")) {
    return new AdapterError(message, "ENGINE_PANIC", { original: raw });
  }

  if (typeof code === "string") {
    switch (code) {
      case "P2002": {
        const target = meta?.target as string[] | undefined;
        const column = Array.isArray(target) ? target[0] : undefined;
        return new AdapterUniqueViolationError(message, {
          column: typeof column === "string" ? column : undefined,
          constraint: str(meta?.target),
        });
      }
      case "P2003":
        return new AdapterForeignKeyViolationError(message, {
          column: str(meta?.field_name),
        });
      case "P2011":
        return new AdapterNotNullViolationError(message, {
          column: str(meta?.column) || str(meta?.constraint),
        });
      case "P2014":
      case "P2017":
        return new AdapterForeignKeyViolationError(message, {
          column: str(meta?.relation_name),
        });
      case "P2025":
        return new AdapterNotFoundError(message, {
          table: str(meta?.modelName),
        });
      case "P1000":
      case "P1001":
      case "P1002":
      case "P1003":
      case "P1009":
      case "P1010":
      case "P1011":
      case "P1017":
      case "P2037":
        return new AdapterConnectionError(message, { code });
      case "P1008":
      case "P2024":
        return new AdapterTimeoutError(message, { code });
      case "P2000":
        return new AdapterMappingError(message, {
          column: str(meta?.column_name),
        });
      case "P2001":
        return new AdapterNotFoundError(message, {
          table: str(meta?.model_name),
        });
      case "P2004":
      case "P2035":
        return new AdapterCheckViolationError(message, {
          constraint: str(meta?.database_error),
        });
      case "P2005":
      case "P2006":
      case "P2007":
      case "P2012":
      case "P2013":
      case "P2019":
      case "P2020":
      case "P2021":
      case "P2022":
      case "P2023":
      case "P2033":
        return new AdapterMappingError(message, {
          column: str(meta?.field_name) || str(meta?.column) || str(meta?.table),
        });
      case "P2015":
      case "P2018":
        return new AdapterNotFoundError(message, {
          table: str(meta?.modelName) || str(meta?.model_name),
        });
      case "P2026":
        return new AdapterUnsupportedError(message, {
          operation: str(meta?.feature),
        });
      case "P2028":
      case "P2034":
        return new AdapterTransactionError(message, { code });
      case "P2030":
        return new AdapterUnsupportedError(message, { operation: "fulltext" });
    }
  }

  return new AdapterError(message, "UNKNOWN", { original: raw });
}
