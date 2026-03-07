/**
 * @justwant/lock — lock exists but expiresAt < now
 */

import { LockError } from "./LockError.js";

export class LockExpiredError extends LockError {
  override name = "LockExpiredError";
  constructor(
    message: string,
    public readonly lockableKey: string,
    public readonly expiresAt: Date
  ) {
    super(message);
    Object.setPrototypeOf(this, LockExpiredError.prototype);
  }
}
