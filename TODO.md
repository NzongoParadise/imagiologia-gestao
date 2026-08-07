# TODO — Fechar ciclo de chamada de voz (algoritmo WhatsApp)

## Objetivo
Completar a lógica de chamadas de voz com o ciclo de vida estilo WhatsApp, incluindo o estado `NAO_ATENDIDA` (missed call).

## Etapas

- [ ] 1. `chamada-actions.ts`: marcar `NAO_ATENDIDA` em `terminarChamada` quando a chamada ainda está `A_CHAMAR`
- [ ] 2. `chamada-actions.ts`: criar action `marcarNaoAtendida` (timeout/desistência do chamador)
- [ ] 3. `use-chamada-voz.ts`: importar `marcarNaoAtendida` e corrigir indentação de `peerRef`
- [ ] 4. `use-chamada-voz.ts`: adicionar timeout de 30s de chamada não atendida (só o chamador)
- [ ] 5. `use-chamada-voz.ts`: limpar o timeout em aceitar/terminar/cancelar/finalizarPeer
- [ ] 6. Validação com `npx tsc --noEmit` / `npm run build`
- [ ] 7. Commit e push

