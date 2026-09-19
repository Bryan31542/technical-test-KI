import { canAdvanceStatus, type CaseStatus } from './case-status';
import { toCaseListItem, type CaseListItem, type CaseWithContact } from './case-view';

export type UpdateCaseStatusResult =
  | { kind: 'ok'; case: CaseListItem }
  | { kind: 'not_found' }
  | { kind: 'invalid_transition'; from: CaseStatus; to: CaseStatus };

export type UpdateCaseStatusDb = {
  case: {
    findUnique: (args: {
      where: { id: string };
      include: { contact: { select: { phone: true } } };
    }) => Promise<CaseWithContact | null>;
    update: (args: {
      where: { id: string };
      data: { status: CaseStatus };
      include: { contact: { select: { phone: true } } };
    }) => Promise<CaseWithContact>;
  };
};

export async function updateCaseStatus(
  db: UpdateCaseStatusDb,
  input: { id: string; status: CaseStatus },
): Promise<UpdateCaseStatusResult> {
  const current = await db.case.findUnique({
    where: { id: input.id },
    include: { contact: { select: { phone: true } } },
  });

  if (!current) {
    return { kind: 'not_found' };
  }

  if (current.status === input.status) {
    return { kind: 'ok', case: toCaseListItem(current) };
  }

  if (!canAdvanceStatus(current.status, input.status)) {
    return {
      kind: 'invalid_transition',
      from: current.status,
      to: input.status,
    };
  }

  const updated = await db.case.update({
    where: { id: input.id },
    data: { status: input.status },
    include: { contact: { select: { phone: true } } },
  });

  return { kind: 'ok', case: toCaseListItem(updated) };
}
