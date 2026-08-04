import { getResumoGeral, getRelatorioPeriodo } from "@/server/actions/relatorios-actions";
import { verificarPermissao } from "@/lib/permissions-server";
import { RelatoriosClient } from "./relatorios-client";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  await verificarPermissao("relatorios");

  const now = new Date();
  
  // Período padrão: este mês
  const dataInicio = new Date(now.getFullYear(), now.getMonth(), 1);
  const dataFim = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [resumoGeral, relatorio] = await Promise.all([
    getResumoGeral(),
    getRelatorioPeriodo({ dataInicio, dataFim }),
  ]);

  return (
    <RelatoriosClient
      resumoGeral={JSON.parse(JSON.stringify(resumoGeral))}
      relatorio={JSON.parse(JSON.stringify(relatorio))}
    />
  );
}

