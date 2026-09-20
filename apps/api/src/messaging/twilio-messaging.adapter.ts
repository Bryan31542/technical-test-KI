import { sendOutboundToDb, type OutboundDb } from './send-outbound';
import type { MessagingPort, SendMessageInput } from './messaging.port';

export type TwilioMessagesClient = {
  messages: {
    create: (args: {
      to: string;
      from: string;
      contentSid: string;
      contentVariables: string;
    }) => Promise<{ sid: string }>;
  };
};

export class TwilioMessagingAdapter implements MessagingPort {
  constructor(
    private readonly twilio: TwilioMessagesClient,
    private readonly db: OutboundDb,
    private readonly from: string,
    private readonly contentSid: string,
  ) {}

  async send(input: SendMessageInput): Promise<void> {
    const message = await this.twilio.messages.create({
      to: input.to,
      from: this.from,
      contentSid: this.contentSid,
      contentVariables: JSON.stringify({ '1': input.body }),
    });

    await sendOutboundToDb(this.db, {
      caseId: input.caseId,
      body: input.body,
      providerSid: message.sid,
    });
  }
}
