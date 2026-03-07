/**
 * @justwant/lock — invalid params for lockable (singular with params, plural without)
 */

import { LockError } from "./LockError.js";

export class LockableParamsError extends LockError {
  override name = "LockableParamsError";
  constructor(
    message: string,
    public readonly lockableName: string,
    public readonly reason: string
  ) {
    super(message);
    Object.setPrototypeOf(this, LockableParamsError.prototype);
  }
}
