/**
 * @justwant/lock — Base error
 */

export class LockError extends Error {
  override name = "LockError";
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, LockError.prototype);
  }
}
