/**
 * @justwant/context — Base error
 */

export class ContextError extends Error {
  override name = "ContextError";

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ContextError.prototype);
  }
}
