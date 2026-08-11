CREATE TABLE "pedidos_exame" (
    "id" SERIAL NOT NULL,
    "atendimento_id" INTEGER NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "tipo_exame_id" INTEGER NOT NULL,
    "prioridade" TEXT NOT NULL DEFAULT 'Normal',
    "justificativa" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDENTE',
    "criado_por_id" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pedidos_exame_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "receitas" (
    "id" SERIAL NOT NULL,
    "atendimento_id" INTEGER NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "observacoes" TEXT,
    "criado_por_id" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "receitas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "receita_medicamentos" (
    "id" SERIAL NOT NULL,
    "receita_id" INTEGER NOT NULL,
    "medicamento" TEXT NOT NULL,
    "dosagem" TEXT,
    "via" TEXT,
    "frequencia" TEXT,
    "duracao_dias" INTEGER,
    "quantidade" TEXT,
    "observacoes" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "receita_medicamentos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pedidos_exame_atendimento_id_idx" ON "pedidos_exame"("atendimento_id");
CREATE INDEX "pedidos_exame_paciente_id_idx" ON "pedidos_exame"("paciente_id");
CREATE INDEX "pedidos_exame_estado_idx" ON "pedidos_exame"("estado");
CREATE INDEX "receitas_atendimento_id_idx" ON "receitas"("atendimento_id");
CREATE INDEX "receitas_paciente_id_idx" ON "receitas"("paciente_id");
CREATE INDEX "receita_medicamentos_receita_id_idx" ON "receita_medicamentos"("receita_id");

ALTER TABLE "pedidos_exame" ADD CONSTRAINT "pedidos_exame_atendimento_id_fkey" FOREIGN KEY ("atendimento_id") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pedidos_exame" ADD CONSTRAINT "pedidos_exame_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pedidos_exame" ADD CONSTRAINT "pedidos_exame_tipo_exame_id_fkey" FOREIGN KEY ("tipo_exame_id") REFERENCES "tipos_exame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pedidos_exame" ADD CONSTRAINT "pedidos_exame_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "receitas" ADD CONSTRAINT "receitas_atendimento_id_fkey" FOREIGN KEY ("atendimento_id") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "receitas" ADD CONSTRAINT "receitas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "receitas" ADD CONSTRAINT "receitas_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "receita_medicamentos" ADD CONSTRAINT "receita_medicamentos_receita_id_fkey" FOREIGN KEY ("receita_id") REFERENCES "receitas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
