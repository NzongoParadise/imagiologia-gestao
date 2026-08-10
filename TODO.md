# TODO — Módulo 1: Atendimento (Consultas e Urgências)

## Objetivo
Completar o módulo de Atendimento, que já tem as server actions (`atendimento-actions.ts`),
os modelos Prisma e as permissões criados, mas **não tem páginas de UI nem navegação**.

## Passos
- [x] 1. Analisar o schema dos modelos de Atendimento (Atendimento, AtendimentoConsulta, AtendimentoUrgencia, Triagem, FilaAtendimento, SenhaAtendimento, Encaminhamento, Especialidade, BancoUrgencia, ClassificacaoRisco)
- [x] 2. Criar `src/app/(dashboard)/atendimento/page.tsx` — página principal com resumo/navegação
- [x] 3. Criar `src/app/(dashboard)/atendimento/consultas/page.tsx` — listagem e criação de consultas
- [x] 4. Criar `src/app/(dashboard)/atendimento/urgencias/page.tsx` — listagem e criação de urgências
- [x] 5. Criar `src/app/(dashboard)/atendimento/encaminhamentos/page.tsx` — listagem e gestão de encaminhamentos
- [x] 6. Criar `src/app/(dashboard)/atendimento/dashboard/page.tsx` — indicadores do dia
- [x] 7. Criar `src/app/(dashboard)/atendimento/relatorios/page.tsx` — relatórios
- [x] 8. Criar `src/app/(dashboard)/atendimento/atendimento-client.tsx` — componente cliente partilhado
- [x] 9. Editar `src/components/layout/sidebar.tsx` — adicionar link "Atendimento" ao menu
- [x] 10. Validar com `npx tsc --noEmit`
- [x] 11. Validar com `npm run build`
