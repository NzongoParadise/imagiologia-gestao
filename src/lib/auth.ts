import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./db";
import type { Role } from "@/lib/permissions";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const utilizador = await prisma.utilizador.findUnique({
          where: { email },
        });

        if (!utilizador || !utilizador.ativo) {
          return null;
        }

        const isValid = await compare(password, utilizador.password);

        if (!isValid) {
          return null;
        }

        return {
          id: String(utilizador.id),
          email: utilizador.email,
          name: utilizador.nome,
          role: utilizador.role as Role,
        };
      },
    }),
  ],
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
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  // Permite que o NextAuth derive o host a partir do cabeçalho da requisição,
  // permitindo acesso por localhost e por IP da rede local (ex: 192.168.x.x).
  trustHost: true,
});
