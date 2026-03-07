/**
 * @justwant/user — Duplicate email
 */

import { UserError } from "./UserError.js";

export class DuplicateEmailError extends UserError {
  override name = "DuplicateEmailError";

  constructor(
    message: string,
    public readonly email: string
  ) {
    super(message);
    Object.setPrototypeOf(this, DuplicateEmailError.prototype);
  }
}
