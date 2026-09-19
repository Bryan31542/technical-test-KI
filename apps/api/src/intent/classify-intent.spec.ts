import { classifyIntent } from './classify-intent';

describe('classifyIntent', () => {
  it.each([
    ['¿cuándo empieza el ciclo?', 'FECHAS_CICLOS'],
    ['fechas de pago de matrícula', 'FECHAS_PAGO'],
    ['cómo me inscribo', 'INSCRIPCION'],
    ['info sobre admisión a ingeniería', 'ADMISIONES'],
    ['quiero poner un reclamo', 'RECLAMO'],
  ] as const)('classifies %s as %s', (text, intent) => {
    expect(classifyIntent(text)).toBe(intent);
  });

  it('treats a mixed reclamo + inscripción as RECLAMO', () => {
    expect(
      classifyIntent(
        'Quiero poner un reclamo porque llevo tres días esperando respuesta sobre mi inscripción.',
      ),
    ).toBe('RECLAMO');
  });

  it('treats an ambiguous payment question as FECHAS_PAGO', () => {
    expect(classifyIntent('¿Cuándo pago?')).toBe('FECHAS_PAGO');
  });

  it('falls back when the message is a greeting or empty', () => {
    expect(classifyIntent('hola, ¿qué tal?')).toBe('DESCONOCIDA');
    expect(classifyIntent('   ')).toBe('DESCONOCIDA');
    expect(classifyIntent('')).toBe('DESCONOCIDA');
  });

  it('ignores accents and casing', () => {
    expect(classifyIntent('RECLAMACIÓN URGENTE')).toBe('RECLAMO');
    expect(classifyIntent('Admisión')).toBe('ADMISIONES');
  });
});
