-- CreateTable
CREATE TABLE "backups" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'manual',
    "tamanho" INTEGER NOT NULL DEFAULT 0,
    "numRegistos" INTEGER NOT NULL DEFAULT 0,
    "dados" BYTEA NOT NULL,
    "criadoPorId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "backups_criadoEm_idx" ON "backups"("criadoEm");

-- CreateIndex
CREATE INDEX "backups_criadoPorId_idx" ON "backups"("criadoPorId");

-- AddForeignKey
ALTER TABLE "backups" ADD CONSTRAINT "backups_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
