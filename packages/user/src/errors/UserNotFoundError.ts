/**
 * @justwant/user — User not found
 */

import { UserError } from "./UserError.js";

export class UserNotFoundError extends UserError {
  override name = "UserNotFoundError";

  constructor(
    message: string,
    public readonly userId?: string,
    public readonly email?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, UserNotFoundError.prototype);
  }
}
