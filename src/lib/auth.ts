import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./db";
import { authConfig } from "./auth.config";
import type { Role } from "@/lib/permissions";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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
});
