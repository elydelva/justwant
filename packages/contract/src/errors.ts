/**
 * Contract-specific errors.
 */

export class ContractConformityError extends Error {
  constructor(
    message: string,
    public readonly missing?: string[]
  ) {
    super(message);
    this.name = "ContractConformityError";
  }
}
