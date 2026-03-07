/**
 * @justwant/context — Slot not found in context
 */

import { ContextError } from "./ContextError.js";

export class SlotNotFoundError extends ContextError {
  override name = "SlotNotFoundError";

  constructor(
    message: string,
    public readonly slotKey: string
  ) {
    super(message);
    Object.setPrototypeOf(this, SlotNotFoundError.prototype);
  }
}
