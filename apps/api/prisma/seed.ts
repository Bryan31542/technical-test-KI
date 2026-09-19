import path from 'node:path';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// This file lives in apps/api/prisma, so ../.env is apps/api/.env
// (the same file Prisma migrate loads).
config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const knowledgeBase = [
  {
    intent: 'FECHAS_CICLOS',
    title: 'Fechas del ciclo vigente',
    body: [
      'Ciclo 2026-2:',
      '- Inicio de clases: 4 de agosto de 2026.',
      '- Fin de clases: 12 de diciembre de 2026.',
      '- Matrícula ordinaria: del 15 al 30 de julio de 2026.',
      '- Matrícula extemporánea: del 31 de julio al 8 de agosto de 2026.',
    ].join('\n'),
  },
  {
    intent: 'FECHAS_PAGO',
    title: 'Calendario de pagos',
    body: [
      'Pagos de matrícula del ciclo 2026-2:',
      '- Primera cuota: 15 de agosto de 2026.',
      '- Segunda cuota: 15 de septiembre de 2026.',
      '- Tercera cuota: 15 de octubre de 2026.',
      'La fecha límite de cada cuota es el mismo día. Después de 5 días hábiles se genera mora.',
    ].join('\n'),
  },
  {
    intent: 'INSCRIPCION',
    title: 'Cómo inscribirse',
    body: [
      'Pasos generales de inscripción:',
      '1. Crear una cuenta en el portal de admisiones.',
      '2. Completar la ficha con datos personales y carrera de interés.',
      '3. Subir DUI o pasaporte, certificado de estudios y foto carnet.',
      '4. Pagar el derecho de inscripción.',
      '5. Esperar la constancia por correo en un máximo de 5 días hábiles.',
    ].join('\n'),
  },
  {
    intent: 'ADMISIONES',
    title: 'Información de admisiones',
    body: [
      'Admisiones — Facultad de Ingeniería:',
      '- Carreras: Ingeniería de Sistemas, Civil, Industrial y Electrónica.',
      '- Modalidad: presencial, con algunas asignaturas virtuales.',
      '- Contacto: admisiones@universidad.example / +506 2222-2222.',
      '- Horario de atención: lunes a viernes, 9:00 a 18:00.',
    ].join('\n'),
  },
] as const;

async function main() {
  for (const entry of knowledgeBase) {
    await prisma.knowledgeEntry.upsert({
      where: { intent: entry.intent },
      update: { title: entry.title, body: entry.body },
      create: {
        intent: entry.intent,
        title: entry.title,
        body: entry.body,
      },
    });
  }

  console.log(`Seeded ${knowledgeBase.length} knowledge entries`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
