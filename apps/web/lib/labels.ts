import type { CaseStatus, CaseType, DetectedIntent } from "./types";

export const CASE_TYPES: CaseType[] = ["CONSULTA", "RECLAMO"];
export const CASE_STATUSES: CaseStatus[] = [
  "ABIERTO",
  "EN_PROCESO",
  "CERRADO",
];

const STATUS_RANK: Record<CaseStatus, number> = {
  ABIERTO: 0,
  EN_PROCESO: 1,
  CERRADO: 2,
};

export function nextStatuses(current: CaseStatus): CaseStatus[] {
  return CASE_STATUSES.filter(
    (status) => STATUS_RANK[status] > STATUS_RANK[current],
  );
}

export const TYPE_LABEL: Record<CaseType, string> = {
  CONSULTA: "Consulta",
  RECLAMO: "Reclamo",
};

export const STATUS_LABEL: Record<CaseStatus, string> = {
  ABIERTO: "Abierto",
  EN_PROCESO: "En proceso",
  CERRADO: "Cerrado",
};

export const INTENT_LABEL: Record<DetectedIntent, string> = {
  FECHAS_CICLOS: "Fechas de ciclos",
  FECHAS_PAGO: "Fechas de pago",
  INSCRIPCION: "Inscripción",
  ADMISIONES: "Admisiones",
  RECLAMO: "Reclamo",
  DESCONOCIDA: "Desconocida",
};

export function formatPhone(phone: string): string {
  return phone.replace(/^whatsapp:/, "");
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
