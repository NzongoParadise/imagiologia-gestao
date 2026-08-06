# TODO — Módulo Diagnóstico Assistido por IA (Portal do Médico)

## Etapas

- [x] 1. Análise do projeto e plano
- [x] 2. Adicionar modelo `AnaliseIA` ao `prisma/schema.prisma`
- [x] 3. Criar migration Prisma
- [x] 4. Criar tipos de IA (`src/features/medico/types/ia.ts`)
- [x] 5. Criar serviço de IA (`src/services/ai.service.ts`)
- [x] 6. Adicionar server actions de IA em `medico-actions.ts`
- [x] 7. Criar API route `GET /api/ia/historico/[exameId]`
- [x] 8. Criar componentes de IA (DiagnosisCard, ConfidenceScore, FindingsList, HeatmapViewer, ComparisonResult, AIReport, AIHistoryTable)
- [x] 9. Criar página `/medico/exames/[id]/diagnostico`
- [x] 10. Adicionar botão "Diagnóstico IA" na página de detalhe do exame
- [x] 11. Validação com `npm run build`
- [x] 12. Commit e push
