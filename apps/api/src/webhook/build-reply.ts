export const MENU_REPLY = [
  'Puedo ayudarte con información de la universidad. Escribe sobre una de estas opciones:',
  '- Fechas del ciclo',
  '- Fechas de pago',
  '- Cómo inscribirte',
  '- Admisiones',
  '- Poner un reclamo',
].join('\n');

export const RECLAMO_REPLY =
  'Registramos tu reclamo y quedó abierto para el equipo de admisiones. Te contactaremos por este mismo número.';

export async function buildReply(
  intent: 'FECHAS_CICLOS' | 'FECHAS_PAGO' | 'INSCRIPCION' | 'ADMISIONES' | 'RECLAMO' | 'DESCONOCIDA',
  findKnowledge: (
    intent: 'FECHAS_CICLOS' | 'FECHAS_PAGO' | 'INSCRIPCION' | 'ADMISIONES',
  ) => Promise<{ title: string; body: string } | null>,
): Promise<string> {
  if (intent === 'RECLAMO') {
    return RECLAMO_REPLY;
  }

  if (intent === 'DESCONOCIDA') {
    return MENU_REPLY;
  }

  const entry = await findKnowledge(intent);
  if (!entry) {
    return MENU_REPLY;
  }

  return `${entry.title}\n\n${entry.body}`;
}
