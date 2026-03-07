/**
 * @justwant/organisation — OrganisationError
 */

export class OrganisationError extends Error {
  override name = "OrganisationError";

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, OrganisationError.prototype);
  }
}
