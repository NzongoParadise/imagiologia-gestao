// ---------------------------------------------------------------------------
// Proxy global de proteção de rotas (Next.js 16)
// Este ficheiro é automaticamente detetado pelo Next.js 16 para proteger
// todas as rotas da aplicação. Garante que o utilizador está autenticado
// e tem permissão para aceder aos módulos do dashboard.
// ---------------------------------------------------------------------------

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { temPermissao, type Modulo, MENU_MODULOS } from "@/lib/permissions";

// Instância de auth edge-safe (sem providers Node/Prisma) para o middleware.
const { auth } = NextAuth(authConfig);

export default async function proxy(request: Request) {
  const { pathname } = new URL(request.url);

  // Ignorar ficheiros estáticos, API de auth, login, etc.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/uploads") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/login") ||
    pathname === "/" ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$/)
  ) {
    return undefined;
  }

  const session = await auth();

  // Se não estiver autenticado, redirecionar para login
  if (!session?.user) {
    return Response.redirect(new URL("/login", request.url));
  }

  // Verificar permissão para a rota do dashboard
  if (pathname.startsWith("/acesso-negado")) {
    return undefined;
  }

  // Mapear pathname para módulo
  const basePath = "/" + pathname.split("/")[1];
  const modulo = MENU_MODULOS[basePath] as Modulo | undefined;

  if (modulo) {
    const role = session.user.role as string | undefined;
    if (!temPermissao(role, modulo)) {
      return Response.redirect(new URL("/acesso-negado", request.url));
    }
  }

  return undefined;
}
