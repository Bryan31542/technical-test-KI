import { TwilioMessagingAdapter } from './twilio-messaging.adapter';
import { ReplyViaTwimlError } from './reply-via-twiml';
import type { OutboundDb } from './send-outbound';

describe('TwilioMessagingAdapter', () => {
  const input = {
    to: 'whatsapp:+5035550000',
    body: 'Puedo ayudarte con información de la universidad.',
    caseId: 'case-1',
  };

  it('sends the reply body then stores the outbound row', async () => {
    const create = jest.fn().mockResolvedValue({ sid: 'SM-out-1' });
    const db: OutboundDb = {
      message: { create: jest.fn().mockResolvedValue({ id: 'msg-out' }) },
    };
    const adapter = new TwilioMessagingAdapter(
      { messages: { create } },
      db,
      'whatsapp:+17372508034',
    );

    await adapter.send(input);

    expect(create).toHaveBeenCalledWith({
      to: input.to,
      from: 'whatsapp:+17372508034',
      body: input.body,
    });
    expect(db.message.create).toHaveBeenCalledWith({
      data: {
        caseId: 'case-1',
        direction: 'OUTBOUND',
        body: input.body,
        providerSid: 'SM-out-1',
      },
    });
  });

  it('persists and asks for TwiML when Twilio requires a ContentSid', async () => {
    const create = jest.fn().mockRejectedValue(new Error('ContentSid Required'));
    const db: OutboundDb = {
      message: { create: jest.fn().mockResolvedValue({ id: 'msg-out' }) },
    };
    const adapter = new TwilioMessagingAdapter(
      { messages: { create } },
      db,
      'whatsapp:+17372508034',
    );

    await expect(adapter.send(input)).rejects.toBeInstanceOf(ReplyViaTwimlError);
    expect(db.message.create).toHaveBeenCalledWith({
      data: {
        caseId: 'case-1',
        direction: 'OUTBOUND',
        body: input.body,
        providerSid: null,
      },
    });
  });

  it('does not persist when Twilio send fails for another reason', async () => {
    const create = jest.fn().mockRejectedValue(new Error('provider down'));
    const db: OutboundDb = {
      message: { create: jest.fn() },
    };
    const adapter = new TwilioMessagingAdapter(
      { messages: { create } },
      db,
      'whatsapp:+17372508034',
    );

    await expect(adapter.send(input)).rejects.toThrow('provider down');
    expect(db.message.create).not.toHaveBeenCalled();
  });
});
