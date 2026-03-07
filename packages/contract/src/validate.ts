/**
 * Standard Schema validation for contract fields.
 */

import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { AnyContract, FieldDef } from "./contract.js";

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult<T> {
  ok: true;
  value: T;
}
export interface ValidationError {
  ok: false;
  issues: ValidationIssue[];
}

/** Error class for throwing on validation failure. */
export class ContractValidationError extends Error {
  readonly issues: ValidationIssue[];
  constructor(issues: ValidationIssue[]) {
    const msg = issues.map((i) => `${i.path}: ${i.message}`).join("; ");
    super(msg);
    this.name = "ContractValidationError";
    this.issues = issues;
  }
}

export type ValidateResult<T> = ValidationResult<T> | ValidationError;

function validateWithSchema<T>(
  schema: StandardSchemaV1<unknown, T>,
  value: unknown
): { valid: boolean; value?: T; issues?: ValidationIssue[] } {
  const std = (schema as { "~standard"?: { validate: (v: unknown) => unknown } })["~standard"];
  if (!std?.validate) return { valid: true, value: value as T };
  const result = std.validate(value);
  if (result && typeof (result as Promise<unknown>).then === "function") {
    return { valid: false, issues: [{ path: "", message: "Async validation not supported" }] };
  }
  const r = result as { value?: T; issues?: readonly { message?: string; path?: string }[] };
  if (r.issues?.length) {
    return {
      valid: false,
      issues: (r.issues as { message?: string; path?: string }[]).map((i) => ({
        path: i.path ?? "",
        message: i.message ?? "Validation failed",
      })),
    };
  }
  return { valid: true, value: r.value };
}

export interface ValidateOptions {
  /** Only validate these keys (e.g. for partial update). */
  keys?: string[];
}

/**
 * Validates data against contract fields that have _schema.
 * Returns validated data or validation error.
 */
export function validateContractData<T extends Record<string, unknown>>(
  data: T,
  contract: AnyContract,
  options?: ValidateOptions
): ValidateResult<T> {
  const issues: ValidationIssue[] = [];
  const result = { ...data } as Record<string, unknown>;
  const keysToValidate = options?.keys ?? (Object.keys(contract) as (keyof typeof contract)[]);

  for (const key of keysToValidate) {
    if (!(key in data)) continue; // skip keys not in data (e.g. partial update)
    const field = (contract as Record<string, unknown>)[key] as
      | FieldDef<unknown, boolean>
      | undefined;
    if (!field?._schema) continue;
    const value = data[key as keyof T];
    const {
      valid,
      value: validatedValue,
      issues: fieldIssues,
    } = validateWithSchema(field._schema, value);
    if (!valid) {
      const path = String(key);
      if (fieldIssues?.length) {
        for (const i of fieldIssues) {
          issues.push({ path: i.path || path, message: i.message });
        }
      } else {
        issues.push({ path, message: "Validation failed" });
      }
      continue;
    }
    if (validatedValue !== undefined) {
      result[key as string] = validatedValue;
    }
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, value: result as T };
}
