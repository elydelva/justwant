/**
 * @justwant/lock — release/extend without holding the lock
 */

import { LockError } from "./LockError.js";

export class LockNotHeldError extends LockError {
  override name = "LockNotHeldError";
  constructor(
    message: string,
    public readonly lockableKey: string,
    public readonly ownerType: string,
    public readonly ownerId: string
  ) {
    super(message);
    Object.setPrototypeOf(this, LockNotHeldError.prototype);
  }
}
