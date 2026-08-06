-- CreateTable
CREATE TABLE "analises_ia" (
    "id" SERIAL NOT NULL,
    "exame_id" INTEGER NOT NULL,
    "utilizador_id" INTEGER,
    "imagem_id" INTEGER,
    "modelo" TEXT NOT NULL DEFAULT 'TorchXRayVision',
    "diagnostico_principal" TEXT,
    "confianca" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "achados" JSONB NOT NULL,
    "resumo" TEXT NOT NULL,
    "resultado_json" JSONB NOT NULL,
    "heatmap" TEXT,
    "preLaudo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'concluido',
    "tempo_processamento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analises_ia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analises_ia_exame_id_idx" ON "analises_ia"("exame_id");

-- CreateIndex
CREATE INDEX "analises_ia_utilizador_id_idx" ON "analises_ia"("utilizador_id");

-- AddForeignKey
ALTER TABLE "analises_ia" ADD CONSTRAINT "analises_ia_exame_id_fkey" FOREIGN KEY ("exame_id") REFERENCES "exames"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analises_ia" ADD CONSTRAINT "analises_ia_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
