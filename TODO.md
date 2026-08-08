# TODO — Aplicar IA Gemini ao Portal Médico

## Passos
- [x] 1. Analisar o fluxo de IA do portal médico (medico-actions → ai.service → ml-service)
- [x] 2. Confirmar o plano com o utilizador
- [x] 3. Modificar `src/services/ai.service.ts`:
  - Importar `gerarComGemini, geminiConfigurado` do `gemini.service`
  - Criar `gerarPreLaudoComGemini()` (geração de pré-laudo clínico enriquecido)
  - Usar Gemini em `analisarImagemComIA()` quando configurado, com fallback para `gerarPreLaudo()`
- [x] 4. Validar build/typecheck
- [ ] 5. Commit e push para `main` (deploy Vercel produção)
