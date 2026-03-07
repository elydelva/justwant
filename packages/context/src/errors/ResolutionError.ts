/**
 * @justwant/context — Slot resolution failed
 */

import { ContextError } from "./ContextError.js";

export class ResolutionError extends ContextError {
  override name = "ResolutionError";

  constructor(
    message: string,
    public readonly slotKey: string,
    public readonly cause?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, ResolutionError.prototype);
  }
}
