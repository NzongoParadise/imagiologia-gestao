import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/lib/permissions";

// ---------------------------------------------------------------------------
// Configuração de autenticação SEGURA para o Edge Runtime (middleware/proxy)
//
// O NextAuth v5 recomenda separar a configuração base (edge-safe) dos providers.
// Os providers Credentials usam Prisma/bcryptjs (módulos Node.js) que NÃO são
// compatíveis com o Edge Runtime usado pelo middleware/proxy (`proxy.ts`).
//
// Ao importar `authConfig` (sem providers Node) no proxy, o NextAuth consegue
// verificar a sessão JWT sem carregar Prisma, evitando o erro `/api/auth/error`
// em deploys edge (Vercel).
// ---------------------------------------------------------------------------

export const authConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role as Role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as Role;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  // Permite que o NextAuth derive o host a partir do cabeçalho da requisição,
  // permitindo acesso por localhost e por IP de rede local e em produção.
  trustHost: true,
} satisfies NextAuthConfig;
