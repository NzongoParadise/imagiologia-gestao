# TODO — Chamada de Voz com engenharia completa estilo WhatsApp

## Objetivo
Implementar todas as funcionalidades WhatsApp na parte de chamadas de voz:
1. Histórico/página de chamadas (Todas / Perdidas / Feitas / Recebidas)
2. Notificação push/do navegador (chamada recebida + missed call)
3. Vibração/feedback háptico ao tocar
4. Alternar altifalante (speaker) durante a chamada
5. Manter ecrã ativo (Wake Lock) durante a chamada
6. Presença online associada às chamadas

## Etapas
- [x] 0. Análise e plano
- [x] 1. Tipos de histórico de chamadas (`types/index.ts`)
- [x] 2. Server action `listarChamadas()` (histórico com direção feita/recebida/perdida)
- [x] 3. Hook: vibração, wake lock, altifalante, notificações
- [x] 4. UI do modal: botão altifalante
- [x] 5. Página `/chamadas` com abas (cliente)
- [x] 6. Menu lateral "Chamadas" + permissões
- [x] 7. Validação `npx tsc --noEmit` + build
- [x] 8. Commit e push
