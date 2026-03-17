/**
 * @justwant/embedding — Error types.
 */

export class EmbeddingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmbeddingError";
    Object.setPrototypeOf(this, EmbeddingError.prototype);
  }
}

export class UniverseNotFoundError extends EmbeddingError {
  constructor(universeId: string) {
    super(`Universe not found: ${universeId}`);
    this.name = "UniverseNotFoundError";
    Object.setPrototypeOf(this, UniverseNotFoundError.prototype);
  }
}

export class InvalidStorageError extends EmbeddingError {
  constructor(reason: string) {
    super(`Invalid storage: ${reason}`);
    this.name = "InvalidStorageError";
    Object.setPrototypeOf(this, InvalidStorageError.prototype);
  }
}
