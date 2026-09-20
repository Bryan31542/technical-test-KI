import { sendOutboundToDb, type OutboundDb } from './send-outbound';
import {
  isContentSidRequired,
  ReplyViaTwimlError,
} from './reply-via-twiml';

import type {
  MessagingPort,
  SendMessageInput,
} from './messaging.port';

export type TwilioMessagesClient = {
  messages: {
    create: (args: {
      to: string;
      from: string;
      body: string;
    }) => Promise<{ sid: string }>;
  };
};

export class TwilioMessagingAdapter implements MessagingPort {
  constructor(
    private readonly twilio: TwilioMessagesClient,
    private readonly db: OutboundDb,
    private readonly from: string,
  ) {}

  async send(input: SendMessageInput): Promise<void> {
    try {
      const message = await this.twilio.messages.create({
        to: input.to,
        from: this.from,
        body: input.body,
      });

      await sendOutboundToDb(this.db, {
        caseId: input.caseId,
        body: input.body,
        providerSid: message.sid,
      });
    } catch (error) {
      if (!isContentSidRequired(error)) {
        throw error;
      }

      await sendOutboundToDb(this.db, {
        caseId: input.caseId,
        body: input.body,
        providerSid: null,
      });
      throw new ReplyViaTwimlError();
    }
  }
}
