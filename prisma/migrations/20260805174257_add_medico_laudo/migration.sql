-- AlterTable
ALTER TABLE "exames" ADD COLUMN     "diagnostico_clinico" TEXT,
ADD COLUMN     "justificacao_clinica" TEXT,
ADD COLUMN     "prioridade" TEXT NOT NULL DEFAULT 'Normal',
ADD COLUMN     "solicitado_por_id" INTEGER,
ALTER COLUMN "estado" SET DEFAULT 'Solicitado';

-- CreateTable
CREATE TABLE "laudos" (
    "id" SERIAL NOT NULL,
    "exame_id" INTEGER NOT NULL,
    "conteudo" TEXT NOT NULL,
    "medico_assinou_id" INTEGER,
    "assinado" BOOLEAN NOT NULL DEFAULT false,
    "assinatura" TEXT,
    "assinado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laudos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "laudos_medico_assinou_id_idx" ON "laudos"("medico_assinou_id");

-- CreateIndex
CREATE UNIQUE INDEX "laudos_exame_id_key" ON "laudos"("exame_id");

-- CreateIndex
CREATE INDEX "exames_prioridade_idx" ON "exames"("prioridade");

-- AddForeignKey
ALTER TABLE "exames" ADD CONSTRAINT "exames_solicitado_por_id_fkey" FOREIGN KEY ("solicitado_por_id") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laudos" ADD CONSTRAINT "laudos_exame_id_fkey" FOREIGN KEY ("exame_id") REFERENCES "exames"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laudos" ADD CONSTRAINT "laudos_medico_assinou_id_fkey" FOREIGN KEY ("medico_assinou_id") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
