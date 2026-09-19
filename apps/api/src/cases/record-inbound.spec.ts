import { caseTypeForIntent } from './case-type';
import { recordInbound, type InboundDb } from './record-inbound';

function createDb(): jest.Mocked<InboundDb> {
  return {
    contact: {
      upsert: jest.fn(),
    },
    case: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    message: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
}

describe('caseTypeForIntent', () => {
  it('opens a RECLAMO only for the reclamo intent', () => {
    expect(caseTypeForIntent('RECLAMO')).toBe('RECLAMO');
    expect(caseTypeForIntent('INSCRIPCION')).toBe('CONSULTA');
    expect(caseTypeForIntent('DESCONOCIDA')).toBe('CONSULTA');
  });
});

describe('recordInbound', () => {
  const phone = 'whatsapp:+5035550000';

  it('creates a CONSULTA and stores the inbound message', async () => {
    const db = createDb();
    db.message.findUnique.mockResolvedValue(null);
    db.contact.upsert.mockResolvedValue({ id: 'contact-1' });
    db.case.findFirst.mockResolvedValue(null);
    db.case.create.mockResolvedValue({
      id: 'case-1',
      contactId: 'contact-1',
      type: 'CONSULTA',
      status: 'ABIERTO',
      lastIntent: 'FECHAS_CICLOS',
    });
    db.message.create.mockResolvedValue({ id: 'msg-1' });
    db.case.update.mockResolvedValue({
      id: 'case-1',
      contactId: 'contact-1',
      type: 'CONSULTA',
      status: 'ABIERTO',
      lastIntent: 'FECHAS_CICLOS',
    });

    const result = await recordInbound(db, {
      phone,
      body: '¿cuándo empieza el ciclo?',
      intent: 'FECHAS_CICLOS',
      providerSid: 'SM1',
    });

    expect(result.duplicated).toBe(false);
    expect(result.case.type).toBe('CONSULTA');
    expect(db.case.create).toHaveBeenCalledWith({
      data: {
        contactId: 'contact-1',
        type: 'CONSULTA',
        status: 'ABIERTO',
        lastIntent: 'FECHAS_CICLOS',
      },
    });
    expect(db.message.create).toHaveBeenCalledWith({
      data: {
        caseId: 'case-1',
        direction: 'INBOUND',
        body: '¿cuándo empieza el ciclo?',
        providerSid: 'SM1',
      },
    });
  });

  it('creates a RECLAMO when the intent is a claim', async () => {
    const db = createDb();
    db.message.findUnique.mockResolvedValue(null);
    db.contact.upsert.mockResolvedValue({ id: 'contact-1' });
    db.case.findFirst.mockResolvedValue(null);
    db.case.create.mockResolvedValue({
      id: 'case-2',
      contactId: 'contact-1',
      type: 'RECLAMO',
      status: 'ABIERTO',
      lastIntent: 'RECLAMO',
    });
    db.message.create.mockResolvedValue({ id: 'msg-2' });
    db.case.update.mockResolvedValue({
      id: 'case-2',
      contactId: 'contact-1',
      type: 'RECLAMO',
      status: 'ABIERTO',
      lastIntent: 'RECLAMO',
    });

    const result = await recordInbound(db, {
      phone,
      body: 'quiero poner un reclamo',
      intent: 'RECLAMO',
      providerSid: 'SM2',
    });

    expect(result.case.type).toBe('RECLAMO');
    expect(db.case.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'RECLAMO' }),
      }),
    );
  });

  it('appends a message to an already open case of that type', async () => {
    const db = createDb();
    db.contact.upsert.mockResolvedValue({ id: 'contact-1' });
    db.case.findFirst.mockResolvedValue({
      id: 'case-1',
      contactId: 'contact-1',
      type: 'CONSULTA',
      status: 'ABIERTO',
      lastIntent: 'FECHAS_CICLOS',
    });
    db.message.create.mockResolvedValue({ id: 'msg-3' });
    db.case.update.mockResolvedValue({
      id: 'case-1',
      contactId: 'contact-1',
      type: 'CONSULTA',
      status: 'ABIERTO',
      lastIntent: 'FECHAS_PAGO',
    });

    const result = await recordInbound(db, {
      phone,
      body: '¿cuándo pago?',
      intent: 'FECHAS_PAGO',
    });

    expect(db.case.create).not.toHaveBeenCalled();
    expect(db.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ caseId: 'case-1' }),
      }),
    );
    expect(result.case.lastIntent).toBe('FECHAS_PAGO');
  });

  it('does not insert again when the same MessageSid already exists', async () => {
    const db = createDb();
    db.message.findUnique.mockResolvedValue({
      caseId: 'case-1',
      case: {
        id: 'case-1',
        contactId: 'contact-1',
        type: 'CONSULTA',
        status: 'ABIERTO',
        lastIntent: 'FECHAS_CICLOS',
      },
    });

    const result = await recordInbound(db, {
      phone,
      body: '¿cuándo empieza el ciclo?',
      intent: 'FECHAS_CICLOS',
      providerSid: 'SM1',
    });

    expect(result.duplicated).toBe(true);
    expect(db.contact.upsert).not.toHaveBeenCalled();
    expect(db.message.create).not.toHaveBeenCalled();
  });

  it('retries as an update when creating the case races on the unique index', async () => {
    const db = createDb();
    db.contact.upsert.mockResolvedValue({ id: 'contact-1' });
    db.case.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'case-1',
        contactId: 'contact-1',
        type: 'CONSULTA',
        status: 'ABIERTO',
        lastIntent: 'FECHAS_CICLOS',
      });
    db.case.create.mockRejectedValue({ code: 'P2002' });
    db.message.create.mockResolvedValue({ id: 'msg-4' });
    db.case.update.mockResolvedValue({
      id: 'case-1',
      contactId: 'contact-1',
      type: 'CONSULTA',
      status: 'ABIERTO',
      lastIntent: 'FECHAS_CICLOS',
    });

    const result = await recordInbound(db, {
      phone,
      body: '¿cuándo empieza el ciclo?',
      intent: 'FECHAS_CICLOS',
    });

    expect(db.case.create).toHaveBeenCalled();
    expect(db.case.findFirst).toHaveBeenCalledTimes(2);
    expect(result.case.id).toBe('case-1');
    expect(result.duplicated).toBe(false);
  });
});
