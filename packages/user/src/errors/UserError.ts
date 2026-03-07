/**
 * @justwant/user — Base error
 */

export class UserError extends Error {
  override name = "UserError";

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, UserError.prototype);
  }
}
