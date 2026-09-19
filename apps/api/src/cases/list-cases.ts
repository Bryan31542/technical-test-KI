import type { CaseType } from './case-type';
import type { CaseStatus } from './case-status';
import { toCaseListItem, type CaseListItem, type CaseWithContact } from './case-view';

export type ListCasesFilters = {
  type?: CaseType;
  status?: CaseStatus;
};

export type ListCasesDb = {
  case: {
    findMany: (args: {
      where: { type?: CaseType; status?: CaseStatus };
      include: { contact: { select: { phone: true } } };
      orderBy: { updatedAt: 'desc' };
    }) => Promise<CaseWithContact[]>;
  };
};

export async function listCases(
  db: ListCasesDb,
  filters: ListCasesFilters = {},
): Promise<CaseListItem[]> {
  const rows = await db.case.findMany({
    where: {
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    include: { contact: { select: { phone: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  return rows.map(toCaseListItem);
}
