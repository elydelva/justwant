/**
 * @justwant/referral — Errors
 */

export class ReferralError extends Error {
  readonly code: string;
  readonly metadata?: Record<string, unknown>;

  constructor(message: string, code = "REFERRAL_ERROR", metadata?: Record<string, unknown>) {
    super(message);
    this.name = "ReferralError";
    this.code = code;
    this.metadata = metadata;
  }
}

export class AlreadyReferredError extends ReferralError {
  constructor(
    public readonly offerKey: string,
    public readonly recipientId: string,
    metadata?: Record<string, unknown>
  ) {
    super(
      `Recipient ${recipientId} has already been referred for offer ${offerKey}`,
      "ALREADY_REFERRED",
      { ...metadata, offerKey, recipientId }
    );
    this.name = "AlreadyReferredError";
  }
}

export class InvalidReferralCodeError extends ReferralError {
  constructor(
    public readonly offerKey: string,
    public readonly referralCode: string,
    metadata?: Record<string, unknown>
  ) {
    super(
      `Invalid or expired referral code "${referralCode}" for offer ${offerKey}`,
      "INVALID_REFERRAL_CODE",
      { ...metadata, offerKey, referralCode }
    );
    this.name = "InvalidReferralCodeError";
  }
}
