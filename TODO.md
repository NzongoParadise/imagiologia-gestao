# Upload de Imagens no Vercel — Armazenamento no Neon (bytea)

## Contexto
O upload de imagens dependia de `fs/promises` gravando no filesystem efêmero do Vercel, que não persiste. Vamos armazenar os bytes da imagem numa coluna `bytea` no Neon PostgreSQL, preservando as URLs `/api/uploads/...`.

## Passos

- [x] 1. Adicionar coluna `dados Bytea?` ao modelo `Imagem` no `prisma/schema.prisma`
- [x] 2. Criar e aplicar migração Prisma para a nova coluna
- [x] 3. Atualizar `uploadImagem()` em `src/server/actions/imagens-actions.ts` para gravar os bytes no banco
- [x] 4. Atualizar `removerImagem()` em `src/server/actions/imagens-actions.ts` para remover apenas o registo do banco
- [x] 5. Atualizar `src/app/api/uploads/[...path]/route.ts` para ler os bytes do banco em vez do disco
- [x] 6. Regenerar cliente Prisma (`prisma generate`)
- [x] 7. Testar fluxo de upload/leitura localmente
- [x] 8. Commit e push para o GitHub (redeploy no Vercel)
