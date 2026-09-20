import { TwilioMessagingAdapter } from './twilio-messaging.adapter';
import type { OutboundDb } from './send-outbound';

describe('TwilioMessagingAdapter', () => {
  const input = {
    to: 'whatsapp:+5035550000',
    body: 'Registramos tu reclamo.',
    caseId: 'case-1',
  };

  it('sends a content template then stores the outbound row', async () => {
    const create = jest.fn().mockResolvedValue({ sid: 'SM-out-1' });
    const db: OutboundDb = {
      message: { create: jest.fn().mockResolvedValue({ id: 'msg-out' }) },
    };
    const adapter = new TwilioMessagingAdapter(
      { messages: { create } },
      db,
      'whatsapp:+17372508034',
      'HXtemplate',
    );

    await adapter.send(input);

    expect(create).toHaveBeenCalledWith({
      to: input.to,
      from: 'whatsapp:+17372508034',
      contentSid: 'HXtemplate',
      contentVariables: JSON.stringify({ '1': input.body }),
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

  it('does not persist when Twilio send fails', async () => {
    const create = jest.fn().mockRejectedValue(new Error('ContentSid Required'));
    const db: OutboundDb = {
      message: { create: jest.fn() },
    };
    const adapter = new TwilioMessagingAdapter(
      { messages: { create } },
      db,
      'whatsapp:+17372508034',
      'HXtemplate',
    );

    await expect(adapter.send(input)).rejects.toThrow('ContentSid Required');
    expect(db.message.create).not.toHaveBeenCalled();
  });
});
