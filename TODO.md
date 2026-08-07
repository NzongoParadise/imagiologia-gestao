# TODO — Aplicar paginação no histórico de chamadas

## Objetivo
Adicionar paginação à listagem do histórico de chamadas (`historico-chamadas-client.tsx`), mantendo as abas de filtro (Todas / Perdidas / Feitas / Recebidas).

## Passos
- [x] Adicionar estado `currentPage` e `pageSize` no `HistoricoChamadasClient`
- [x] Aplicar paginação sobre a lista filtrada (`filtradas`)
- [x] Reset de `currentPage` para 1 ao trocar de aba
- [x] Renderizar apenas os itens da página atual
- [x] Adicionar o componente `Pagination` no rodapé (apenas quando necessário)
- [x] Importar `Pagination` de `@/components/ui/pagination`
- [x] Verificar lint/typecheck
