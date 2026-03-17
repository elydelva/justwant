/**
 * @justwant/job — QStash signature verification
 */

export type QStashVerifiableEngine = {
  verifySignature?(
    req: Request | { headers: { get: (n: string) => string | null }; text?: () => Promise<string> }
  ): Promise<boolean>;
  assertSignature?(
    req: Request | { headers: { get: (n: string) => string | null }; text?: () => Promise<string> }
  ): Promise<void>;
};

export function hasVerifySignature(engine: unknown): engine is QStashVerifiableEngine {
  return typeof (engine as QStashVerifiableEngine)?.verifySignature === "function";
}
