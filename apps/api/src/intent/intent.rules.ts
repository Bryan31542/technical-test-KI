export const DETECTED_INTENTS = [
  'FECHAS_CICLOS',
  'FECHAS_PAGO',
  'INSCRIPCION',
  'ADMISIONES',
  'RECLAMO',
  'DESCONOCIDA',
] as const;

export type DetectedIntent = (typeof DETECTED_INTENTS)[number];

export type ClassifiableIntent = Exclude<DetectedIntent, 'DESCONOCIDA'>;

export type IntentRule = {
  intent: ClassifiableIntent;
  pattern: RegExp;
};

// First match wins. RECLAMO is first so a mixed "reclamo + inscripción" is a claim.
export const INTENT_RULES: IntentRule[] = [
  {
    intent: 'RECLAMO',
    pattern: /\b(reclamo|queja|denuncia|reclamacion)\b/,
  },
  {
    intent: 'FECHAS_PAGO',
    pattern: /\b(pago|pagar|cuota|mora|vencimiento)\b/,
  },
  {
    intent: 'FECHAS_CICLOS',
    pattern: /\b(ciclo|semestre|cuatrimestre|clases)\b/,
  },
  {
    intent: 'INSCRIPCION',
    pattern: /inscrib|inscripcion|\bmatricul|\brequisito/,
  },
  {
    intent: 'ADMISIONES',
    pattern: /\b(admision|admisiones|carrera|ingenier)/,
  },
];

export function normalizeMessage(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
