/**
 * @justwant/notify — Errors
 */

export class NotifyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotifyError";
    Object.setPrototypeOf(this, NotifyError.prototype);
  }
}

export class TemplateNotFoundError extends NotifyError {
  constructor(public readonly templateId: string) {
    super(`Template not found: ${templateId}`);
    this.name = "TemplateNotFoundError";
    Object.setPrototypeOf(this, TemplateNotFoundError.prototype);
  }
}

export class CanalNotFoundError extends NotifyError {
  constructor(public readonly canalId: string) {
    super(`Canal not found: ${canalId}`);
    this.name = "CanalNotFoundError";
    Object.setPrototypeOf(this, CanalNotFoundError.prototype);
  }
}

export class TemplateVersionNotFoundError extends NotifyError {
  constructor(
    public readonly templateId: string,
    public readonly canalId: string,
    public readonly channelKind: string
  ) {
    super(`Template "${templateId}" has no version for canal "${canalId}" (kind: ${channelKind})`);
    this.name = "TemplateVersionNotFoundError";
    Object.setPrototypeOf(this, TemplateVersionNotFoundError.prototype);
  }
}
