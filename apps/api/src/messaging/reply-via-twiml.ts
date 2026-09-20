export class ReplyViaTwimlError extends Error {
  readonly replyViaTwiml = true as const;

  constructor() {
    super('Twilio blocked freeform body; reply via TwiML');
    this.name = 'ReplyViaTwimlError';
  }
}

export function isReplyViaTwimlError(
  error: unknown,
): error is ReplyViaTwimlError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'replyViaTwiml' in error &&
    (error as { replyViaTwiml: unknown }).replyViaTwiml === true
  );
}

export function isContentSidRequired(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /contentsid required/i.test(message);
}
