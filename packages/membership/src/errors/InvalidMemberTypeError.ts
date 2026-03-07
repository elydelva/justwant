/**
 * @justwant/membership — Member type not accepted by group
 */

import { MembershipError } from "./MembershipError.js";

export class InvalidMemberTypeError extends MembershipError {
  override name = "InvalidMemberTypeError";

  constructor(
    message: string,
    public readonly memberType: string,
    public readonly groupType: string,
    public readonly expectedMemberType: string
  ) {
    super(message);
    Object.setPrototypeOf(this, InvalidMemberTypeError.prototype);
  }
}
