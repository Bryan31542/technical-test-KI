import {
  toCaseListItem,
  type CaseDetail,
  type CaseMessageView,
  type CaseWithContact,
} from './case-view';

export type CaseDetailRow = CaseWithContact & {
  messages: CaseMessageView[];
};

export type GetCaseDb = {
  case: {
    findUnique: (args: {
      where: { id: string };
      include: {
        contact: { select: { phone: true } };
        messages: {
          orderBy: { createdAt: 'asc' };
          select: {
            id: true;
            direction: true;
            body: true;
            createdAt: true;
          };
        };
      };
    }) => Promise<CaseDetailRow | null>;
  };
};

export async function getCase(
  db: GetCaseDb,
  id: string,
): Promise<CaseDetail | null> {
  const row = await db.case.findUnique({
    where: { id },
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

  if (!row) {
    return null;
  }

  return {
    ...toCaseListItem(row),
    messages: row.messages,
  };
}
