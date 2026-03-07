/**
 * @justwant/membership — Member not in group
 */

import { MembershipError } from "./MembershipError.js";

export class NotMemberError extends MembershipError {
  override name = "NotMemberError";

  constructor(
    message: string,
    public readonly memberType: string,
    public readonly memberId: string,
    public readonly groupType: string,
    public readonly groupId: string
  ) {
    super(message);
    Object.setPrototypeOf(this, NotMemberError.prototype);
  }
}
