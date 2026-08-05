import { verificarPermissao } from "@/lib/permissions-server";
import { obterDadosSolicitacao } from "@/server/actions/medico-actions";
import { SolicitarExameForm } from "./solicitar-exame-form";

export const dynamic = "force-dynamic";

export default async function SolicitarExamePage() {
  await verificarPermissao("medico", "criar");
  const dados = await obterDadosSolicitacao();

  return (
    <SolicitarExameForm
      pacientes={JSON.parse(JSON.stringify(dados.pacientes))}
      tiposExame={JSON.parse(JSON.stringify(dados.tiposExame))}
    />
  );
}
