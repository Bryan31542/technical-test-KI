import { sendOutboundToDb, type OutboundDb } from './send-outbound';

describe('sendOutboundToDb', () => {
  it('stores the reply as an outbound message with no provider sid', async () => {
    const db: OutboundDb = {
      message: {
        create: jest.fn().mockResolvedValue({ id: 'msg-out' }),
      },
    };

    await sendOutboundToDb(db, {
      caseId: 'case-1',
      body: 'El ciclo 2026-2 inicia el 4 de agosto.',
    });

    expect(db.message.create).toHaveBeenCalledWith({
      data: {
        caseId: 'case-1',
        direction: 'OUTBOUND',
        body: 'El ciclo 2026-2 inicia el 4 de agosto.',
        providerSid: null,
      },
    });
  });
});
