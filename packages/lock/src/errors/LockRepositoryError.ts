/**
 * @justwant/lock — repo operation failed (create, update, delete)
 */

import { LockError } from "./LockError.js";

export class LockRepositoryError extends LockError {
  override name = "LockRepositoryError";
  constructor(
    message: string,
    public readonly operation: string,
    public readonly cause?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, LockRepositoryError.prototype);
  }
}
