# Migração para Neon (PostgreSQL)

## Passos

- [x] 1. Alterar `provider` de `sqlite` para `postgresql` no `prisma/schema.prisma` (já feito)
- [x] 2. Atualizar `.env` com `DATABASE_URL` do Neon
- [x] 3. Atualizar `prisma/migrations/migration_lock.toml` para `provider = "postgresql"`
- [x] 4. Remover migrações SQLite antigas
- [x] 5. Criar migração inicial limpa para PostgreSQL
- [x] 6. Aplicar migrações na Neon
- [x] 7. Correr o seed para dados de referência
- [x] 8. Regenerar cliente Prisma e verificar build

