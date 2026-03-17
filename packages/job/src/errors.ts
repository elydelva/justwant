/**
 * @justwant/job — Errors
 */

export class JobError extends Error {
  readonly code: string;
  readonly metadata?: Record<string, unknown>;

  constructor(message: string, code = "JOB_ERROR", metadata?: Record<string, unknown>) {
    super(message);
    this.name = "JobError";
    this.code = code;
    this.metadata = metadata;
  }
}

export class EngineIncompatibleError extends JobError {
  constructor(
    message: string,
    public readonly engineName: string,
    public readonly runtime: string,
    metadata?: Record<string, unknown>
  ) {
    super(message, "ENGINE_INCOMPATIBLE", { ...metadata, engineName, runtime });
    this.name = "EngineIncompatibleError";
  }
}

export class JobNotFoundError extends JobError {
  constructor(public readonly jobId: string) {
    super(`Job not found: ${jobId}`, "JOB_NOT_FOUND", { jobId });
    this.name = "JobNotFoundError";
  }
}

export class JobValidationError extends JobError {
  constructor(
    message: string,
    public readonly jobId: string,
    public readonly issues?: Array<{ path: string; message: string }>
  ) {
    super(message, "JOB_VALIDATION_ERROR", { jobId, issues });
    this.name = "JobValidationError";
  }
}

export class UnsupportedCapabilityError extends JobError {
  constructor(
    public readonly engineName: string,
    public readonly operation: string,
    message?: string
  ) {
    super(
      message ?? `Engine '${engineName}' does not support operation '${operation}'`,
      "UNSUPPORTED_CAPABILITY",
      { engineName, operation }
    );
    this.name = "UnsupportedCapabilityError";
  }
}
