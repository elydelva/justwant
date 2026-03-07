/**
 * @justwant/membership — Member already in group
 */

import { MembershipError } from "./MembershipError.js";

export class AlreadyMemberError extends MembershipError {
  override name = "AlreadyMemberError";

  constructor(
    message: string,
    public readonly memberType: string,
    public readonly memberId: string,
    public readonly groupType: string,
    public readonly groupId: string
  ) {
    super(message);
    Object.setPrototypeOf(this, AlreadyMemberError.prototype);
  }
}
