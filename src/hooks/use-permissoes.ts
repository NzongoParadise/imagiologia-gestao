"use client";

import { useSession } from "next-auth/react";
import { temPermissao, type Modulo, type Acao } from "@/lib/permissions";

/**
 * Hook client para controlar a UI conforme a role do utilizador.
 * Exemplo:
 *   const { pode } = usePermissoes();
 *   {pode("exames", "criar") && <button>Novo Exame</button>}
 */
export function usePermissoes() {
  const { data: session } = useSession();
  const role = (session?.user as Record<string, unknown> | undefined)?.role as
    | string
    | undefined;

  function pode(modulo: Modulo, acao: Acao = "ver"): boolean {
    return temPermissao(role, modulo, acao);
  }

  return {
    role,
    pode,
  };
}

