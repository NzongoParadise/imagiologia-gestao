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

## Correções (análise server-safe)

- [x] 11. Adicionar funções server-safe ao `ml-service.ts` (chamarBackendIAServer, gerarDiagnosticoFallbackServer, diagnosticarImagemServer)
- [x] 12. Atualizar `ai.service.ts` para usar `diagnosticarImagemServer` (bytes da BD) em vez de APIs de browser
- [x] 13. Mapear `regioesInteresse` -> `regioes` na normalização para o HeatmapViewer
- [x] 14. Validação com `npm run build` (TypeScript + Next.js compilam sem erros)
- [ ] 15. Commit e push
