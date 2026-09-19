import type { DetectedIntent } from '../intent/intent.rules';

export type CaseType = 'CONSULTA' | 'RECLAMO';

export function caseTypeForIntent(intent: DetectedIntent): CaseType {
  return intent === 'RECLAMO' ? 'RECLAMO' : 'CONSULTA';
}
