/**
 * @justwant/organisation — DuplicateSlugError
 */

import { OrganisationError } from "./OrganisationError.js";

export class DuplicateSlugError extends OrganisationError {
  override name = "DuplicateSlugError";

  constructor(
    message: string,
    public readonly slug: string
  ) {
    super(message);
    Object.setPrototypeOf(this, DuplicateSlugError.prototype);
  }
}
