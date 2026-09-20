import { buildReply, MENU_REPLY, RECLAMO_REPLY } from './build-reply';
import { handleWhatsAppInbound } from './handle-whatsapp';
import { ReplyViaTwimlError } from '../messaging/reply-via-twiml';

describe('buildReply', () => {
  it('confirms a reclamo without hitting the knowledge base', async () => {
    const findKnowledge = jest.fn();
    await expect(buildReply('RECLAMO', findKnowledge)).resolves.toBe(
      RECLAMO_REPLY,
    );
    expect(findKnowledge).not.toHaveBeenCalled();
  });

  it('returns the menu for unknown messages', async () => {
    await expect(buildReply('DESCONOCIDA', jest.fn())).resolves.toBe(MENU_REPLY);
  });

  it('uses the seeded knowledge text for FAQ intents', async () => {
    const reply = await buildReply('FECHAS_CICLOS', async () => ({
      title: 'Fechas del ciclo vigente',
      body: 'Inicio: 4 de agosto.',
    }));
    expect(reply).toContain('Fechas del ciclo vigente');
    expect(reply).toContain('Inicio: 4 de agosto.');
  });
});

describe('handleWhatsAppInbound', () => {
  const inbound = {
    from: 'whatsapp:+5035550000',
    body: 'quiero poner un reclamo',
    messageSid: 'SM-duplicate',
  };

  const openCase = {
    id: 'case-1',
    contactId: 'contact-1',
    type: 'RECLAMO' as const,
    status: 'ABIERTO' as const,
    lastIntent: 'RECLAMO' as const,
  };

  it('sends once, then ignores a second delivery with the same MessageSid', async () => {
    const recordInbound = jest
      .fn()
      .mockResolvedValueOnce({
        duplicated: false,
        contactId: 'contact-1',
        case: openCase,
      })
      .mockResolvedValueOnce({
        duplicated: true,
        contactId: 'contact-1',
        case: openCase,
      });
    const send = jest.fn().mockResolvedValue(undefined);

    const first = await handleWhatsAppInbound(
      { recordInbound, findKnowledge: jest.fn(), send },
      inbound,
    );
    const second = await handleWhatsAppInbound(
      { recordInbound, findKnowledge: jest.fn(), send },
      inbound,
    );

    expect(first).toEqual({
      duplicated: false,
      sendFailed: false,
      intent: 'RECLAMO',
      reply: RECLAMO_REPLY,
    });
    expect(second).toEqual({
      duplicated: true,
      sendFailed: false,
      intent: 'RECLAMO',
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(recordInbound).toHaveBeenCalledTimes(2);
  });

  it('asks the webhook to answer with TwiML when freeform send is blocked', async () => {
    const recordInbound = jest.fn().mockResolvedValue({
      duplicated: false,
      contactId: 'contact-1',
      case: openCase,
    });
    const send = jest.fn().mockRejectedValue(new ReplyViaTwimlError());

    const result = await handleWhatsAppInbound(
      { recordInbound, findKnowledge: jest.fn(), send },
      inbound,
    );

    expect(result).toEqual({
      duplicated: false,
      sendFailed: false,
      replyViaTwiml: true,
      intent: 'RECLAMO',
      reply: RECLAMO_REPLY,
    });
  });

  it('keeps the inbound result when sending the reply fails', async () => {
    const recordInbound = jest.fn().mockResolvedValue({
      duplicated: false,
      contactId: 'contact-1',
      case: openCase,
    });
    const send = jest.fn().mockRejectedValue(new Error('provider down'));

    const result = await handleWhatsAppInbound(
      { recordInbound, findKnowledge: jest.fn(), send },
      inbound,
    );

    expect(result).toEqual({
      duplicated: false,
      sendFailed: true,
      intent: 'RECLAMO',
      reply: RECLAMO_REPLY,
    });
    expect(recordInbound).toHaveBeenCalled();
  });
});
