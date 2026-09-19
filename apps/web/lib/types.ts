export type CaseType = "CONSULTA" | "RECLAMO";
export type CaseStatus = "ABIERTO" | "EN_PROCESO" | "CERRADO";
export type MessageDirection = "INBOUND" | "OUTBOUND";
export type DetectedIntent =
  | "FECHAS_CICLOS"
  | "FECHAS_PAGO"
  | "INSCRIPCION"
  | "ADMISIONES"
  | "RECLAMO"
  | "DESCONOCIDA";

export type CaseListItem = {
  id: string;
  phone: string;
  type: CaseType;
  status: CaseStatus;
  lastIntent: DetectedIntent;
  createdAt: string;
  updatedAt: string;
};

export type CaseMessage = {
  id: string;
  direction: MessageDirection;
  body: string;
  createdAt: string;
};

export type CaseDetail = CaseListItem & {
  messages: CaseMessage[];
};

export type CaseFilters = {
  type?: CaseType;
  status?: CaseStatus;
};
