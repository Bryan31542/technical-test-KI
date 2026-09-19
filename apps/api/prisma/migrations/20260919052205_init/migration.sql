-- CreateEnum
CREATE TYPE "CaseType" AS ENUM ('CONSULTA', 'RECLAMO');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('ABIERTO', 'EN_PROCESO', 'CERRADO');

-- CreateEnum
CREATE TYPE "Intent" AS ENUM ('FECHAS_CICLOS', 'FECHAS_PAGO', 'INSCRIPCION', 'ADMISIONES', 'RECLAMO', 'DESCONOCIDA');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "type" "CaseType" NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'ABIERTO',
    "lastIntent" "Intent" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "body" TEXT NOT NULL,
    "providerSid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_entries" (
    "id" TEXT NOT NULL,
    "intent" "Intent" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "knowledge_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cases_phone_key" ON "cases"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "messages_providerSid_key" ON "messages"("providerSid");

-- CreateIndex
CREATE INDEX "messages_caseId_createdAt_idx" ON "messages"("caseId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_entries_intent_key" ON "knowledge_entries"("intent");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
