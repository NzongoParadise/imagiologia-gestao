import { verificarPermissao } from "@/lib/permissions-server";
import { obterNotificacoesMedico } from "@/server/actions/medico-actions";
import { NotificacoesMedicoClient } from "./notificacoes-medico-client";

export const dynamic = "force-dynamic";

export default async function NotificacoesMedicoPage() {
  await verificarPermissao("medico");
  const notificacoes = await obterNotificacoesMedico();

  return (
    <NotificacoesMedicoClient
      notificacoes={JSON.parse(JSON.stringify(notificacoes))}
    />
  );
}
