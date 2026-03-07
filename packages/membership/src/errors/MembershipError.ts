/**
 * @justwant/membership — Base error
 */

export class MembershipError extends Error {
  override name = "MembershipError";

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, MembershipError.prototype);
  }
}
