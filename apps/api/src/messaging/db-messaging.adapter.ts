import { sendOutboundToDb, type OutboundDb } from './send-outbound';
import type { MessagingPort, SendMessageInput } from './messaging.port';

export class DbMessagingAdapter implements MessagingPort {
  constructor(private readonly db: OutboundDb) {}

  send(input: SendMessageInput): Promise<void> {
    return sendOutboundToDb(this.db, {
      caseId: input.caseId,
      body: input.body,
    });
  }
}
