/**
 * @justwant/organisation — OrganisationNotFoundError
 */

import { OrganisationError } from "./OrganisationError.js";

export class OrganisationNotFoundError extends OrganisationError {
  override name = "OrganisationNotFoundError";

  constructor(
    message: string,
    public readonly organisationId: string
  ) {
    super(message);
    Object.setPrototypeOf(this, OrganisationNotFoundError.prototype);
  }
}
