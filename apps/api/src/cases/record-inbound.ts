import type { DetectedIntent } from '../intent/intent.rules';
import { caseTypeForIntent, type CaseType } from './case-type';
import type { CaseStatus } from './case-status';

export type CaseRecord = {
  id: string;
  contactId: string;
  type: CaseType;
  status: CaseStatus;
  lastIntent: DetectedIntent;
};

export type RecordInboundInput = {
  phone: string;
  body: string;
  intent: DetectedIntent;
  providerSid?: string | null;
};

export type RecordInboundResult = {
  duplicated: boolean;
  contactId: string;
  case: CaseRecord;
};

export type InboundDb = {
  contact: {
    upsert: (args: {
      where: { phone: string };
      create: { phone: string };
      update: object;
    }) => Promise<{ id: string }>;
  };
  case: {
    findFirst: (args: {
      where: {
        contactId: string;
        type: CaseType;
        status: { not: 'CERRADO' };
      };
    }) => Promise<CaseRecord | null>;
    create: (args: {
      data: {
        contactId: string;
        type: CaseType;
        status: 'ABIERTO';
        lastIntent: DetectedIntent;
      };
    }) => Promise<CaseRecord>;
    update: (args: {
      where: { id: string };
      data: { lastIntent: DetectedIntent };
    }) => Promise<CaseRecord>;
  };
  message: {
    findUnique: (args: {
      where: { providerSid: string };
      include: { case: true };
    }) => Promise<{ caseId: string; case: CaseRecord } | null>;
    create: (args: {
      data: {
        caseId: string;
        direction: 'INBOUND';
        body: string;
        providerSid: string | null;
      };
    }) => Promise<{ id: string }>;
  };
};

export async function recordInbound(
  db: InboundDb,
  input: RecordInboundInput,
): Promise<RecordInboundResult> {
  if (input.providerSid) {
    const existing = await db.message.findUnique({
      where: { providerSid: input.providerSid },
      include: { case: true },
    });

    if (existing) {
      return {
        duplicated: true,
        contactId: existing.case.contactId,
        case: existing.case,
      };
    }
  }

  const contact = await db.contact.upsert({
    where: { phone: input.phone },
    create: { phone: input.phone },
    update: {},
  });

  const type = caseTypeForIntent(input.intent);
  const openCase = await findOrCreateOpenCase(db, {
    contactId: contact.id,
    type,
    intent: input.intent,
  });

  try {
    await db.message.create({
      data: {
        caseId: openCase.id,
        direction: 'INBOUND',
        body: input.body,
        providerSid: input.providerSid ?? null,
      },
    });
  } catch (error) {
    if (input.providerSid && isUniqueConflict(error)) {
      return {
        duplicated: true,
        contactId: contact.id,
        case: openCase,
      };
    }
    throw error;
  }

  const updated = await db.case.update({
    where: { id: openCase.id },
    data: { lastIntent: input.intent },
  });

  return {
    duplicated: false,
    contactId: contact.id,
    case: updated,
  };
}

async function findOrCreateOpenCase(
  db: InboundDb,
  input: { contactId: string; type: CaseType; intent: DetectedIntent },
): Promise<CaseRecord> {
  const existing = await db.case.findFirst({
    where: {
      contactId: input.contactId,
      type: input.type,
      status: { not: 'CERRADO' },
    },
  });

  if (existing) {
    return existing;
  }

  try {
    return await db.case.create({
      data: {
        contactId: input.contactId,
        type: input.type,
        status: 'ABIERTO',
        lastIntent: input.intent,
      },
    });
  } catch (error) {
    if (!isUniqueConflict(error)) {
      throw error;
    }

    const raced = await db.case.findFirst({
      where: {
        contactId: input.contactId,
        type: input.type,
        status: { not: 'CERRADO' },
      },
    });

    if (!raced) {
      throw error;
    }

    return raced;
  }
}

function isUniqueConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'P2002'
  );
}
