/**
 * @justwant/lock — acquire(count) when current + count > max
 */

import { LockError } from "./LockError.js";

export class SemaphoreCapacityExceededError extends LockError {
  override name = "SemaphoreCapacityExceededError";
  constructor(
    message: string,
    public readonly lockableKey: string,
    public readonly requested: number,
    public readonly available: number,
    public readonly max: number
  ) {
    super(message);
    Object.setPrototypeOf(this, SemaphoreCapacityExceededError.prototype);
  }
}
