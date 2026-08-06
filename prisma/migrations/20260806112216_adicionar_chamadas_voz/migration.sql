-- CreateTable
CREATE TABLE "chamadas_voz" (
    "id" SERIAL NOT NULL,
    "chamador_id" INTEGER NOT NULL,
    "receptor_id" INTEGER NOT NULL,
    "conversa_id" INTEGER,
    "estado" TEXT NOT NULL DEFAULT 'A_CHAMAR',
    "iniciado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aceite_em" TIMESTAMP(3),
    "terminado_em" TIMESTAMP(3),
    "duracao_seg" INTEGER NOT NULL DEFAULT 0,
    "motivo_fim" TEXT,

    CONSTRAINT "chamadas_voz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sinais_voip" (
    "id" SERIAL NOT NULL,
    "chamada_id" INTEGER NOT NULL,
    "utilizador_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sinais_voip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chamadas_voz_chamador_id_idx" ON "chamadas_voz"("chamador_id");

-- CreateIndex
CREATE INDEX "chamadas_voz_receptor_id_idx" ON "chamadas_voz"("receptor_id");

-- CreateIndex
CREATE INDEX "chamadas_voz_estado_idx" ON "chamadas_voz"("estado");

-- CreateIndex
CREATE INDEX "chamadas_voz_iniciado_em_idx" ON "chamadas_voz"("iniciado_em");

-- CreateIndex
CREATE INDEX "sinais_voip_chamada_id_criado_em_idx" ON "sinais_voip"("chamada_id", "criado_em");

-- AddForeignKey
ALTER TABLE "chamadas_voz" ADD CONSTRAINT "chamadas_voz_chamador_id_fkey" FOREIGN KEY ("chamador_id") REFERENCES "Utilizador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamadas_voz" ADD CONSTRAINT "chamadas_voz_receptor_id_fkey" FOREIGN KEY ("receptor_id") REFERENCES "Utilizador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamadas_voz" ADD CONSTRAINT "chamadas_voz_conversa_id_fkey" FOREIGN KEY ("conversa_id") REFERENCES "conversas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sinais_voip" ADD CONSTRAINT "sinais_voip_chamada_id_fkey" FOREIGN KEY ("chamada_id") REFERENCES "chamadas_voz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sinais_voip" ADD CONSTRAINT "sinais_voip_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "Utilizador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
