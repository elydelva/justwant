import argon2 from "argon2";

/** Fixed Argon2id params for the ecosystem. Native impl via argon2 package (audited). */
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  timeCost: 3,
  memoryCost: 65536, // 64 MiB
  parallelism: 1,
};

/**
 * Hash a password with Argon2id (native, audited). Returns a string in PHC format.
 * Node-only; use verifyPassword to check.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

/**
 * Verify a password against a stored hash (from hashPassword or any argon2id PHC string).
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  return argon2.verify(stored, password);
}
