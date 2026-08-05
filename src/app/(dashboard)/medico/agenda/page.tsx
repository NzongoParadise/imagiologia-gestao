import { verificarPermissao } from "@/lib/permissions-server";
import { obterAgendaMedico } from "@/server/actions/medico-actions";
import { AgendaMedicoClient } from "./agenda-medico-client";

export const dynamic = "force-dynamic";

export default async function AgendaMedicoPage() {
  await verificarPermissao("medico");
  const agenda = await obterAgendaMedico();

  return (
    <AgendaMedicoClient
      agenda={JSON.parse(JSON.stringify(agenda))}
    />
  );
}
