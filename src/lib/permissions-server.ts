// ---------------------------------------------------------------------------
// Guard de permissões — SERVER ONLY
// Utilizado em server components (pages) e server actions.
// NÃO importar em client components.
// ---------------------------------------------------------------------------

import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { temPermissao, type Modulo, type Acao } from "@/lib/permissions";

export class ErroSemPermissao extends Error {
  constructor(modulo: Modulo, acao: Acao) {
    super(`Sem permissão para: ${modulo}.${acao}`);
    this.name = "ErroSemPermissao";
  }
}

/**
 * Verifica se o utilizador autenticado tem permissão.
 * Se não tiver, redireciona para /acesso-negado.
 * Deve ser chamado no topo de server components.
 */
export async function verificarPermissao(
  modulo: Modulo,
  acao: Acao = "ver"
) {
  const session = await auth();
  const role = session?.user?.role as string | undefined;

  if (!temPermissao(role, modulo, acao)) {
    redirect("/acesso-negado");
  }

  return { role: role || "" };
}

/**
 * Verifica se o utilizador autenticado tem permissão.
 * Se não tiver, LANÇA erro (para server actions).
 * As server actions devem chamar `autorizar` antes de qualquer escrita.
 */
export async function autorizar(modulo: Modulo, acao: Acao = "ver") {
  const session = await auth();
  const role = session?.user?.role as string | undefined;

  if (!temPermissao(role, modulo, acao)) {
    throw new ErroSemPermissao(modulo, acao);
  }

  return {
    role: role || "",
    userId: session?.user?.id || null,
  };
}

/**
 * Verifica permissão para API routes.
 * Retorna `null` se autorizado, ou um `NextResponse` de erro 403/401.
 * Uso:
 *   const erro = await autorizarApi("utilizadores");
 *   if (erro) return erro;
 */
export async function autorizarApi(modulo: Modulo, acao: Acao = "ver") {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const role = session.user.role as string | undefined;
  if (!temPermissao(role, modulo, acao)) {
    return NextResponse.json(
      { error: "Sem permissão para esta ação" },
      { status: 403 }
    );
  }

  return null;
}

