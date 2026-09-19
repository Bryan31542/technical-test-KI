import { getCase } from './get-case';
import { listCases } from './list-cases';
import { canAdvanceStatus } from './case-status';
import { updateCaseStatus } from './update-case-status';
import type { CaseWithContact } from './case-view';
import type { GetCaseDb } from './get-case';
import type { ListCasesDb } from './list-cases';
import type { UpdateCaseStatusDb } from './update-case-status';

const now = new Date('2026-09-19T07:00:00.000Z');
const later = new Date('2026-09-19T08:00:00.000Z');

function consulta(): CaseWithContact {
  return {
    id: 'case-1',
    type: 'CONSULTA',
    status: 'ABIERTO',
    lastIntent: 'FECHAS_CICLOS',
    createdAt: now,
    updatedAt: now,
    contact: { phone: 'whatsapp:+5035550000' },
  };
}

function reclamo(): CaseWithContact {
  return {
    id: 'case-2',
    type: 'RECLAMO',
    status: 'ABIERTO',
    lastIntent: 'RECLAMO',
    createdAt: later,
    updatedAt: later,
    contact: { phone: 'whatsapp:+5035550001' },
  };
}

describe('canAdvanceStatus', () => {
  it('allows ABIERTO → EN_PROCESO → CERRADO, including skipping EN_PROCESO', () => {
    expect(canAdvanceStatus('ABIERTO', 'EN_PROCESO')).toBe(true);
    expect(canAdvanceStatus('EN_PROCESO', 'CERRADO')).toBe(true);
    expect(canAdvanceStatus('ABIERTO', 'CERRADO')).toBe(true);
  });

  it('rejects same status, going backwards, or changing a closed case', () => {
    expect(canAdvanceStatus('ABIERTO', 'ABIERTO')).toBe(false);
    expect(canAdvanceStatus('EN_PROCESO', 'ABIERTO')).toBe(false);
    expect(canAdvanceStatus('CERRADO', 'ABIERTO')).toBe(false);
    expect(canAdvanceStatus('CERRADO', 'EN_PROCESO')).toBe(false);
  });
});

describe('listCases', () => {
  it('returns cases newest first and can filter by type and status', async () => {
    const findMany = jest.fn().mockResolvedValue([reclamo(), consulta()]);
    const db: ListCasesDb = { case: { findMany } };

    const rows = await listCases(db, { type: 'RECLAMO', status: 'ABIERTO' });

    expect(findMany).toHaveBeenCalledWith({
      where: { type: 'RECLAMO', status: 'ABIERTO' },
      include: { contact: { select: { phone: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    expect(rows).toEqual([
      {
        id: 'case-2',
        phone: 'whatsapp:+5035550001',
        type: 'RECLAMO',
        status: 'ABIERTO',
        lastIntent: 'RECLAMO',
        createdAt: later,
        updatedAt: later,
      },
      {
        id: 'case-1',
        phone: 'whatsapp:+5035550000',
        type: 'CONSULTA',
        status: 'ABIERTO',
        lastIntent: 'FECHAS_CICLOS',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  });
});

describe('getCase', () => {
  it('returns the case with messages in chronological order', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      ...consulta(),
      messages: [
        {
          id: 'msg-1',
          direction: 'INBOUND',
          body: '¿cuándo empieza el ciclo?',
          createdAt: now,
        },
        {
          id: 'msg-2',
          direction: 'OUTBOUND',
          body: 'El ciclo inicia el 4 de agosto.',
          createdAt: later,
        },
      ],
    });
    const db: GetCaseDb = { case: { findUnique } };

    const detail = await getCase(db, 'case-1');

    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'case-1' },
      include: {
        contact: { select: { phone: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            direction: true,
            body: true,
            createdAt: true,
          },
        },
      },
    });
    expect(detail?.phone).toBe('whatsapp:+5035550000');
    expect(detail?.messages).toHaveLength(2);
    expect(detail?.messages[0]?.direction).toBe('INBOUND');
  });

  it('returns null when the case is missing', async () => {
    const db: GetCaseDb = {
      case: { findUnique: jest.fn().mockResolvedValue(null) },
    };

    await expect(getCase(db, 'missing')).resolves.toBeNull();
  });
});

describe('updateCaseStatus', () => {
  it('advances ABIERTO to EN_PROCESO', async () => {
    const current = consulta();
    const updated = { ...current, status: 'EN_PROCESO' as const, updatedAt: later };
    const db: UpdateCaseStatusDb = {
      case: {
        findUnique: jest.fn().mockResolvedValue(current),
        update: jest.fn().mockResolvedValue(updated),
      },
    };

    const result = await updateCaseStatus(db, {
      id: 'case-1',
      status: 'EN_PROCESO',
    });

    expect(result).toEqual({
      kind: 'ok',
      case: expect.objectContaining({ id: 'case-1', status: 'EN_PROCESO' }),
    });
    expect(db.case.update).toHaveBeenCalledWith({
      where: { id: 'case-1' },
      data: { status: 'EN_PROCESO' },
      include: { contact: { select: { phone: true } } },
    });
  });

  it('is a no-op when the status is already the requested one', async () => {
    const current = consulta();
    const db: UpdateCaseStatusDb = {
      case: {
        findUnique: jest.fn().mockResolvedValue(current),
        update: jest.fn(),
      },
    };

    const result = await updateCaseStatus(db, {
      id: 'case-1',
      status: 'ABIERTO',
    });

    expect(result.kind).toBe('ok');
    expect(db.case.update).not.toHaveBeenCalled();
  });

  it('does not reopen a CERRADO case', async () => {
    const current = { ...consulta(), status: 'CERRADO' as const };
    const db: UpdateCaseStatusDb = {
      case: {
        findUnique: jest.fn().mockResolvedValue(current),
        update: jest.fn(),
      },
    };

    const result = await updateCaseStatus(db, {
      id: 'case-1',
      status: 'ABIERTO',
    });

    expect(result).toEqual({
      kind: 'invalid_transition',
      from: 'CERRADO',
      to: 'ABIERTO',
    });
    expect(db.case.update).not.toHaveBeenCalled();
  });

  it('returns not_found when the case is missing', async () => {
    const db: UpdateCaseStatusDb = {
      case: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
    };

    await expect(
      updateCaseStatus(db, { id: 'missing', status: 'EN_PROCESO' }),
    ).resolves.toEqual({ kind: 'not_found' });
  });
});
