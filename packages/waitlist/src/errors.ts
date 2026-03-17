/**
 * @justwant/waitlist — Errors
 */

export class WaitlistError extends Error {
  readonly code: string;
  readonly metadata?: Record<string, unknown>;

  constructor(message: string, code = "WAITLIST_ERROR", metadata?: Record<string, unknown>) {
    super(message);
    this.name = "WaitlistError";
    this.code = code;
    this.metadata = metadata;
  }
}

export class AlreadySubscribedError extends WaitlistError {
  constructor(
    public readonly listKey: string,
    public readonly actorKey: string
  ) {
    super(`Actor ${actorKey} is already subscribed to list ${listKey}`, "ALREADY_SUBSCRIBED", {
      listKey,
      actorKey,
    });
    this.name = "AlreadySubscribedError";
  }
}

export class NotSubscribedError extends WaitlistError {
  constructor(
    public readonly listKey: string,
    public readonly actorKey: string
  ) {
    super(`Actor ${actorKey} is not subscribed to list ${listKey}`, "NOT_SUBSCRIBED", {
      listKey,
      actorKey,
    });
    this.name = "NotSubscribedError";
  }
}

export class EmptyWaitlistError extends WaitlistError {
  constructor(public readonly listKey: string) {
    super(`List ${listKey} is empty`, "EMPTY_WAITLIST", { listKey });
    this.name = "EmptyWaitlistError";
  }
}
