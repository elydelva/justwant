/**
 * @justwant/lock — acquire failed, lock already held
 */

import { LockError } from "./LockError.js";

export class LockAlreadyHeldError extends LockError {
  override name = "LockAlreadyHeldError";
  constructor(
    message: string,
    public readonly lockableKey: string,
    public readonly currentOwnerType: string,
    public readonly currentOwnerId: string
  ) {
    super(message);
    Object.setPrototypeOf(this, LockAlreadyHeldError.prototype);
  }
}
