export type CaseStatus = 'ABIERTO' | 'EN_PROCESO' | 'CERRADO';

export const CASE_STATUSES = [
  'ABIERTO',
  'EN_PROCESO',
  'CERRADO',
] as const satisfies readonly CaseStatus[];

const STATUS_RANK: Record<CaseStatus, number> = {
  ABIERTO: 0,
  EN_PROCESO: 1,
  CERRADO: 2,
};

export function isCaseStatus(value: string): value is CaseStatus {
  return (CASE_STATUSES as readonly string[]).includes(value);
}

export function canAdvanceStatus(from: CaseStatus, to: CaseStatus): boolean {
  return STATUS_RANK[to] > STATUS_RANK[from];
}
