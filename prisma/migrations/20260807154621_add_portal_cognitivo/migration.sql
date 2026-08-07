-- CreateTable
CREATE TABLE "regioes_anatomicas" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "nome_pt" TEXT NOT NULL,
    "grupo" TEXT NOT NULL DEFAULT 'geral',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "riscoBase" INTEGER NOT NULL DEFAULT 0,
    "descricao" TEXT,
    "icone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regioes_anatomicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicadores_regiao" (
    "id" SERIAL NOT NULL,
    "regiao_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "nivel" TEXT NOT NULL DEFAULT 'normal',
    "observacao" TEXT,
    "medido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exame_id" INTEGER,

    CONSTRAINT "indicadores_regiao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examens_regioes" (
    "id" SERIAL NOT NULL,
    "exame_id" INTEGER NOT NULL,
    "regiao_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "examens_regioes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comparacoes_exame" (
    "id" SERIAL NOT NULL,
    "exame_base_id" INTEGER NOT NULL,
    "exame_comparado_id" INTEGER NOT NULL,
    "regiao_id" INTEGER,
    "tipo" TEXT NOT NULL DEFAULT 'evolucao',
    "resultado_json" JSONB NOT NULL,
    "conclusao" TEXT,
    "novas_lesoes" INTEGER NOT NULL DEFAULT 0,
    "regressao" INTEGER NOT NULL DEFAULT 0,
    "progressao" INTEGER NOT NULL DEFAULT 0,
    "estabilidade" INTEGER NOT NULL DEFAULT 0,
    "criado_por_id" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comparacoes_exame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casos_clinicos" (
    "id" SERIAL NOT NULL,
    "codigo_anonimo" TEXT NOT NULL,
    "diagnostico_principal" TEXT NOT NULL,
    "modalidade" TEXT,
    "regiao_id" INTEGER,
    "faixa_etaria" TEXT,
    "sexo" TEXT,
    "laudo_resumo" TEXT,
    "tratamento" TEXT,
    "desfecho" TEXT,
    "tempo_recuperacao_dias" INTEGER,
    "confirmado" BOOLEAN NOT NULL DEFAULT true,
    "descartado" BOOLEAN NOT NULL DEFAULT false,
    "origem_exame_id" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "casos_clinicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contradicoes" (
    "id" SERIAL NOT NULL,
    "exame_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "severidade" TEXT NOT NULL DEFAULT 'media',
    "descricao" TEXT NOT NULL,
    "detalhe_json" JSONB,
    "estado" TEXT NOT NULL DEFAULT 'aberta',
    "criado_por_id" INTEGER,
    "resolvido_por_id" INTEGER,
    "resolvido_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contradicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "segundas_opinioes" (
    "id" SERIAL NOT NULL,
    "exame_id" INTEGER NOT NULL,
    "solicitado_por_id" INTEGER,
    "radiologista_id" INTEGER,
    "motivo" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'solicitada',
    "laudo_original" TEXT,
    "laudo_segunda" TEXT,
    "coerente" BOOLEAN,
    "conclusao" TEXT,
    "solicitado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concluido_em" TIMESTAMP(3),

    CONSTRAINT "segundas_opinioes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reunioes_clinicas" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "paciente_id" INTEGER,
    "descricao" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'agendada',
    "data_hora" TIMESTAMP(3) NOT NULL,
    "ata" TEXT,
    "ata_json" JSONB,
    "criado_por_id" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reunioes_clinicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reuniao_participantes" (
    "id" SERIAL NOT NULL,
    "reuniao_id" INTEGER NOT NULL,
    "utilizador_id" INTEGER NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'participante',
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reuniao_participantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reuniao_decisoes" (
    "id" SERIAL NOT NULL,
    "reuniao_id" INTEGER NOT NULL,
    "autor_id" INTEGER,
    "descricao" TEXT NOT NULL,
    "responsavel" INTEGER,
    "prazo" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'pendente',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reuniao_decisoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reuniao_exames" (
    "id" SERIAL NOT NULL,
    "reuniao_id" INTEGER NOT NULL,
    "exame_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reuniao_exames_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predicoes_servico" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "parametros" JSONB,
    "resultado" JSONB NOT NULL,
    "confianca" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "modelo" TEXT NOT NULL DEFAULT 'prophet-ts',
    "criada_por_id" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "predicoes_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessoes_ia" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL DEFAULT 'Nova conversa',
    "tipo" TEXT NOT NULL DEFAULT 'assistente',
    "utilizador_id" INTEGER,
    "contexto_json" JSONB,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessoes_ia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagens_ia" (
    "id" SERIAL NOT NULL,
    "sessao_id" INTEGER NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'utilizador',
    "conteudo" TEXT NOT NULL,
    "contexto_json" JSONB,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_ia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "regioes_anatomicas_grupo_idx" ON "regioes_anatomicas"("grupo");

-- CreateIndex
CREATE INDEX "regioes_anatomicas_ordem_idx" ON "regioes_anatomicas"("ordem");

-- CreateIndex
CREATE INDEX "indicadores_regiao_regiao_id_idx" ON "indicadores_regiao"("regiao_id");

-- CreateIndex
CREATE INDEX "indicadores_regiao_medido_em_idx" ON "indicadores_regiao"("medido_em");

-- CreateIndex
CREATE INDEX "examens_regioes_regiao_id_idx" ON "examens_regioes"("regiao_id");

-- CreateIndex
CREATE UNIQUE INDEX "examens_regioes_exame_id_regiao_id_key" ON "examens_regioes"("exame_id", "regiao_id");

-- CreateIndex
CREATE INDEX "comparacoes_exame_exame_base_id_idx" ON "comparacoes_exame"("exame_base_id");

-- CreateIndex
CREATE INDEX "comparacoes_exame_exame_comparado_id_idx" ON "comparacoes_exame"("exame_comparado_id");

-- CreateIndex
CREATE INDEX "comparacoes_exame_criado_por_id_idx" ON "comparacoes_exame"("criado_por_id");

-- CreateIndex
CREATE UNIQUE INDEX "casos_clinicos_codigo_anonimo_key" ON "casos_clinicos"("codigo_anonimo");

-- CreateIndex
CREATE INDEX "casos_clinicos_diagnostico_principal_idx" ON "casos_clinicos"("diagnostico_principal");

-- CreateIndex
CREATE INDEX "casos_clinicos_modalidade_idx" ON "casos_clinicos"("modalidade");

-- CreateIndex
CREATE INDEX "casos_clinicos_regiao_id_idx" ON "casos_clinicos"("regiao_id");

-- CreateIndex
CREATE INDEX "casos_clinicos_confirmado_idx" ON "casos_clinicos"("confirmado");

-- CreateIndex
CREATE INDEX "contradicoes_exame_id_idx" ON "contradicoes"("exame_id");

-- CreateIndex
CREATE INDEX "contradicoes_estado_idx" ON "contradicoes"("estado");

-- CreateIndex
CREATE INDEX "contradicoes_severidade_idx" ON "contradicoes"("severidade");

-- CreateIndex
CREATE INDEX "segundas_opinioes_exame_id_idx" ON "segundas_opinioes"("exame_id");

-- CreateIndex
CREATE INDEX "segundas_opinioes_estado_idx" ON "segundas_opinioes"("estado");

-- CreateIndex
CREATE INDEX "reunioes_clinicas_paciente_id_idx" ON "reunioes_clinicas"("paciente_id");

-- CreateIndex
CREATE INDEX "reunioes_clinicas_data_hora_idx" ON "reunioes_clinicas"("data_hora");

-- CreateIndex
CREATE INDEX "reunioes_clinicas_estado_idx" ON "reunioes_clinicas"("estado");

-- CreateIndex
CREATE INDEX "reuniao_participantes_utilizador_id_idx" ON "reuniao_participantes"("utilizador_id");

-- CreateIndex
CREATE UNIQUE INDEX "reuniao_participantes_reuniao_id_utilizador_id_key" ON "reuniao_participantes"("reuniao_id", "utilizador_id");

-- CreateIndex
CREATE INDEX "reuniao_decisoes_reuniao_id_idx" ON "reuniao_decisoes"("reuniao_id");

-- CreateIndex
CREATE INDEX "reuniao_decisoes_estado_idx" ON "reuniao_decisoes"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "reuniao_exames_reuniao_id_exame_id_key" ON "reuniao_exames"("reuniao_id", "exame_id");

-- CreateIndex
CREATE INDEX "predicoes_servico_tipo_idx" ON "predicoes_servico"("tipo");

-- CreateIndex
CREATE INDEX "predicoes_servico_periodo_idx" ON "predicoes_servico"("periodo");

-- CreateIndex
CREATE INDEX "predicoes_servico_criado_em_idx" ON "predicoes_servico"("criado_em");

-- CreateIndex
CREATE INDEX "sessoes_ia_utilizador_id_idx" ON "sessoes_ia"("utilizador_id");

-- CreateIndex
CREATE INDEX "sessoes_ia_atualizado_em_idx" ON "sessoes_ia"("atualizado_em");

-- CreateIndex
CREATE INDEX "mensagens_ia_sessao_id_idx" ON "mensagens_ia"("sessao_id");

-- CreateIndex
CREATE INDEX "mensagens_ia_criado_em_idx" ON "mensagens_ia"("criado_em");

-- AddForeignKey
ALTER TABLE "indicadores_regiao" ADD CONSTRAINT "indicadores_regiao_regiao_id_fkey" FOREIGN KEY ("regiao_id") REFERENCES "regioes_anatomicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicadores_regiao" ADD CONSTRAINT "indicadores_regiao_exame_id_fkey" FOREIGN KEY ("exame_id") REFERENCES "exames"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examens_regioes" ADD CONSTRAINT "examens_regioes_exame_id_fkey" FOREIGN KEY ("exame_id") REFERENCES "exames"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examens_regioes" ADD CONSTRAINT "examens_regioes_regiao_id_fkey" FOREIGN KEY ("regiao_id") REFERENCES "regioes_anatomicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparacoes_exame" ADD CONSTRAINT "comparacoes_exame_exame_base_id_fkey" FOREIGN KEY ("exame_base_id") REFERENCES "exames"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparacoes_exame" ADD CONSTRAINT "comparacoes_exame_exame_comparado_id_fkey" FOREIGN KEY ("exame_comparado_id") REFERENCES "exames"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparacoes_exame" ADD CONSTRAINT "comparacoes_exame_regiao_id_fkey" FOREIGN KEY ("regiao_id") REFERENCES "regioes_anatomicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparacoes_exame" ADD CONSTRAINT "comparacoes_exame_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos_clinicos" ADD CONSTRAINT "casos_clinicos_regiao_id_fkey" FOREIGN KEY ("regiao_id") REFERENCES "regioes_anatomicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos_clinicos" ADD CONSTRAINT "casos_clinicos_origem_exame_id_fkey" FOREIGN KEY ("origem_exame_id") REFERENCES "exames"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contradicoes" ADD CONSTRAINT "contradicoes_exame_id_fkey" FOREIGN KEY ("exame_id") REFERENCES "exames"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contradicoes" ADD CONSTRAINT "contradicoes_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contradicoes" ADD CONSTRAINT "contradicoes_resolvido_por_id_fkey" FOREIGN KEY ("resolvido_por_id") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segundas_opinioes" ADD CONSTRAINT "segundas_opinioes_exame_id_fkey" FOREIGN KEY ("exame_id") REFERENCES "exames"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segundas_opinioes" ADD CONSTRAINT "segundas_opinioes_solicitado_por_id_fkey" FOREIGN KEY ("solicitado_por_id") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segundas_opinioes" ADD CONSTRAINT "segundas_opinioes_radiologista_id_fkey" FOREIGN KEY ("radiologista_id") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reunioes_clinicas" ADD CONSTRAINT "reunioes_clinicas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reunioes_clinicas" ADD CONSTRAINT "reunioes_clinicas_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reuniao_participantes" ADD CONSTRAINT "reuniao_participantes_reuniao_id_fkey" FOREIGN KEY ("reuniao_id") REFERENCES "reunioes_clinicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reuniao_participantes" ADD CONSTRAINT "reuniao_participantes_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "Utilizador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reuniao_decisoes" ADD CONSTRAINT "reuniao_decisoes_reuniao_id_fkey" FOREIGN KEY ("reuniao_id") REFERENCES "reunioes_clinicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reuniao_decisoes" ADD CONSTRAINT "reuniao_decisoes_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reuniao_exames" ADD CONSTRAINT "reuniao_exames_reuniao_id_fkey" FOREIGN KEY ("reuniao_id") REFERENCES "reunioes_clinicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reuniao_exames" ADD CONSTRAINT "reuniao_exames_exame_id_fkey" FOREIGN KEY ("exame_id") REFERENCES "exames"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predicoes_servico" ADD CONSTRAINT "predicoes_servico_criada_por_id_fkey" FOREIGN KEY ("criada_por_id") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessoes_ia" ADD CONSTRAINT "sessoes_ia_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens_ia" ADD CONSTRAINT "mensagens_ia_sessao_id_fkey" FOREIGN KEY ("sessao_id") REFERENCES "sessoes_ia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
