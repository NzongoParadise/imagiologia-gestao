-- CreateTable
CREATE TABLE "Utilizador" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TECNICO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_visto" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Utilizador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacientes" (
    "id" SERIAL NOT NULL,
    "numero_processo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "data_nascimento" TIMESTAMP(3),
    "sexo" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "documento" TEXT,
    "nif" TEXT,
    "bi" TEXT,
    "foto" TEXT,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tecnico" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "especialidade" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tecnico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Procedencia" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Procedencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoExame" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "modalidade" TEXT,
    "descricao" TEXT,
    "duracaoMin" INTEGER,
    "preco" DOUBLE PRECISION,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoExame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exames" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT,
    "paciente_id" INTEGER NOT NULL,
    "tipo_exame_id" INTEGER NOT NULL,
    "tecnico_id" INTEGER,
    "procedencia_id" INTEGER,
    "medico_solicitante" TEXT,
    "observacao" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Pendente',
    "data_exame" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "realizado_por_id" INTEGER,

    CONSTRAINT "exames_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Imagem" (
    "id" SERIAL NOT NULL,
    "exameId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Imagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes" (
    "id" SERIAL NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'info',
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "utilizadorId" INTEGER,
    "exameId" INTEGER,
    "pacienteId" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Historico" (
    "id" SERIAL NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" INTEGER,
    "descricao" TEXT,
    "utilizadorId" INTEGER,
    "pacienteId" INTEGER,
    "exameId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anotacoes" (
    "id" SERIAL NOT NULL,
    "conteudo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'geral',
    "entidade" TEXT,
    "entidadeId" INTEGER,
    "utilizadorId" INTEGER,
    "exameId" INTEGER,
    "pacienteId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anotacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnos" (
    "id" SERIAL NOT NULL,
    "tecnico_id" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fim" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'Normal',
    "estado" TEXT NOT NULL DEFAULT 'Agendado',
    "observacao" TEXT,
    "criado_por_id" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversas" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT,
    "criada_por_id" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversa_participantes" (
    "id" SERIAL NOT NULL,
    "conversa_id" INTEGER NOT NULL,
    "utilizador_id" INTEGER NOT NULL,
    "lida_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversa_participantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagens" (
    "id" SERIAL NOT NULL,
    "conversa_id" INTEGER NOT NULL,
    "utilizador_id" INTEGER NOT NULL,
    "conteudo" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilizador_email_key" ON "Utilizador"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_numero_processo_key" ON "pacientes"("numero_processo");

-- CreateIndex
CREATE UNIQUE INDEX "Procedencia_nome_key" ON "Procedencia"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "TipoExame_nome_key" ON "TipoExame"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "exames_codigo_key" ON "exames"("codigo");

-- CreateIndex
CREATE INDEX "exames_paciente_id_idx" ON "exames"("paciente_id");

-- CreateIndex
CREATE INDEX "exames_tipo_exame_id_idx" ON "exames"("tipo_exame_id");

-- CreateIndex
CREATE INDEX "exames_tecnico_id_idx" ON "exames"("tecnico_id");

-- CreateIndex
CREATE INDEX "exames_procedencia_id_idx" ON "exames"("procedencia_id");

-- CreateIndex
CREATE INDEX "exames_data_exame_idx" ON "exames"("data_exame");

-- CreateIndex
CREATE INDEX "exames_estado_idx" ON "exames"("estado");

-- CreateIndex
CREATE INDEX "Imagem_exameId_idx" ON "Imagem"("exameId");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_chave_key" ON "configuracoes"("chave");

-- CreateIndex
CREATE INDEX "notificacoes_utilizadorId_idx" ON "notificacoes"("utilizadorId");

-- CreateIndex
CREATE INDEX "notificacoes_lida_idx" ON "notificacoes"("lida");

-- CreateIndex
CREATE INDEX "notificacoes_criado_em_idx" ON "notificacoes"("criado_em");

-- CreateIndex
CREATE INDEX "Historico_createdAt_idx" ON "Historico"("createdAt");

-- CreateIndex
CREATE INDEX "Historico_entidade_entidadeId_idx" ON "Historico"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "anotacoes_createdAt_idx" ON "anotacoes"("createdAt");

-- CreateIndex
CREATE INDEX "anotacoes_entidade_entidadeId_idx" ON "anotacoes"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "turnos_tecnico_id_idx" ON "turnos"("tecnico_id");

-- CreateIndex
CREATE INDEX "turnos_data_idx" ON "turnos"("data");

-- CreateIndex
CREATE INDEX "conversas_criada_por_id_idx" ON "conversas"("criada_por_id");

-- CreateIndex
CREATE INDEX "conversas_atualizado_em_idx" ON "conversas"("atualizado_em");

-- CreateIndex
CREATE INDEX "conversa_participantes_utilizador_id_idx" ON "conversa_participantes"("utilizador_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversa_participantes_conversa_id_utilizador_id_key" ON "conversa_participantes"("conversa_id", "utilizador_id");

-- CreateIndex
CREATE INDEX "mensagens_conversa_id_idx" ON "mensagens"("conversa_id");

-- CreateIndex
CREATE INDEX "mensagens_utilizador_id_idx" ON "mensagens"("utilizador_id");

-- CreateIndex
CREATE INDEX "mensagens_criado_em_idx" ON "mensagens"("criado_em");

-- AddForeignKey
ALTER TABLE "exames" ADD CONSTRAINT "exames_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exames" ADD CONSTRAINT "exames_tipo_exame_id_fkey" FOREIGN KEY ("tipo_exame_id") REFERENCES "TipoExame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exames" ADD CONSTRAINT "exames_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "Tecnico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exames" ADD CONSTRAINT "exames_procedencia_id_fkey" FOREIGN KEY ("procedencia_id") REFERENCES "Procedencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exames" ADD CONSTRAINT "exames_realizado_por_id_fkey" FOREIGN KEY ("realizado_por_id") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Imagem" ADD CONSTRAINT "Imagem_exameId_fkey" FOREIGN KEY ("exameId") REFERENCES "exames"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_exameId_fkey" FOREIGN KEY ("exameId") REFERENCES "exames"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Historico" ADD CONSTRAINT "Historico_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Historico" ADD CONSTRAINT "Historico_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Historico" ADD CONSTRAINT "Historico_exameId_fkey" FOREIGN KEY ("exameId") REFERENCES "exames"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anotacoes" ADD CONSTRAINT "anotacoes_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anotacoes" ADD CONSTRAINT "anotacoes_exameId_fkey" FOREIGN KEY ("exameId") REFERENCES "exames"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anotacoes" ADD CONSTRAINT "anotacoes_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "Tecnico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_criada_por_id_fkey" FOREIGN KEY ("criada_por_id") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversa_participantes" ADD CONSTRAINT "conversa_participantes_conversa_id_fkey" FOREIGN KEY ("conversa_id") REFERENCES "conversas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversa_participantes" ADD CONSTRAINT "conversa_participantes_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "Utilizador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_conversa_id_fkey" FOREIGN KEY ("conversa_id") REFERENCES "conversas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "Utilizador"("id") ON DELETE CASCADE ON UPDATE CASCADE;
