# TODO — Módulo 2: Portal do Médico

## Planeamento
- [x] Análise da base de código existente (schema, permissões, UI, actions)
- [x] Plano aprovado pelo utilizador (implementação completa)

## 1. Schema & Migração
- [x] Adicionar campos ao modelo `Exame`: `prioridade`, `diagnosticoClinico`, `justificacaoClinica`, `solicitadoPorId`
- [x] Criar modelo `Laudo` (conteudo, assinatura, assinado, medicoId, assinadoEm)
- [x] Adicionar relação Utilizador ↔ ExamesSolicitados / LaudosAssinados
- [x] Criar migração SQL para Neon
- [x] Regenerar Prisma Client (`prisma generate`)
- [x] Aplicar migração à base de dados

## 2. Tipos & Permissões
- [x] Adicionar role `MEDICO` em `src/types/index.ts` e `src/lib/permissions.ts`
- [x] Adicionar módulo `medico` e permissões no `permissions.ts`
- [x] Adicionar validators para pedido de exame

## 3. Server Actions (Módulo Médico)
- [x] `medico-actions.ts`: indicadores dashboard, listar/solicitar exames, obter solicitação
- [x] `medico-actions.ts`: alterar prioridade, histórico paciente, comparar exames
- [x] `medico-actions.ts`: laudos (obter/criar/assinar/validar), agenda, comunicação

## 4. Feature Module `src/features/medico/`
- [x] `types/index.ts`
- [x] `constants.ts` (PRIORIDADES, ESTADOS_PORTAL, cores)
- [x] Componente dashboard médico (indicadores)
- [x] Formulário solicitação de exame
- [x] Timeline acompanhamento
- [x] Visualizador de laudo (online, PDF, imprimir, assinatura)
- [x] Visualizador de imagens avançado (zoom, brilho, contraste, rotação, medições, comparação)
- [x] Comunicação com radiologista
- [x] Agenda

## 5. Páginas (`src/app/(dashboard)/medico/`)
- [x] `/medico` — Dashboard
- [x] `/medico/solicitar` — Solicitação de exame
- [x] `/medico/acompanhamento` — Acompanhamento de solicitações
- [x] `/medico/exames/[id]` — Detalhe (timeline, imagens, laudo, prioridade)
- [x] `/medico/pacientes/[id]` — Histórico do paciente
- [x] `/medico/comparar` — Comparação de exames
- [x] `/medico/agenda` — Agenda
- [x] `/medico/notificacoes` — Notificações

## 6. Integração
- [x] Atualizar Sidebar com itens do Portal do Médico
- [x] Atualizar seed com utilizador MEDICO demo
- [x] Atualizar tipos com fluxo do portal médico (`ESTADOS_SOLICITACAO`, `PRIORIDADES_EXAME`)

## 7. Teste
- [x] `prisma generate`
- [ ] Migração / `prisma db push`
- [ ] `npm run dev` e validação das páginas

