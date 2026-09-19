-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contacts_phone_key" ON "contacts"("phone");

-- Move existing case phones onto contacts (no-op if cases is empty)
INSERT INTO "contacts" ("id", "phone", "createdAt", "updatedAt")
SELECT DISTINCT "phone", "phone", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "cases";

-- AlterTable
ALTER TABLE "cases" ADD COLUMN "contactId" TEXT;

UPDATE "cases" AS c
SET "contactId" = ct."id"
FROM "contacts" AS ct
WHERE ct."phone" = c."phone";

DROP INDEX "cases_phone_key";

ALTER TABLE "cases" DROP COLUMN "phone";

ALTER TABLE "cases" ALTER COLUMN "contactId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "cases_contactId_status_idx" ON "cases"("contactId", "status");

-- CreateIndex
CREATE INDEX "cases_contactId_type_idx" ON "cases"("contactId", "type");

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Section 6.4 / 5.2: one open CONSULTA and one open RECLAMO per contact
CREATE UNIQUE INDEX "cases_one_open_per_type_per_contact"
ON "cases" ("contactId", "type")
WHERE "status" <> 'CERRADO';
