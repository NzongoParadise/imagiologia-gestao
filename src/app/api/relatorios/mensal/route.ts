import { NextRequest, NextResponse } from "next/server";
import { getRelatorioPeriodo } from "@/server/actions/relatorios-actions";
import { autorizarApi } from "@/lib/permissions-server";

export async function GET(request: NextRequest) {
  const erro = await autorizarApi("relatorios");
  if (erro) return erro;


  const { searchParams } = new URL(request.url);
  const mes = parseInt(searchParams.get("mes") || "1");
  const ano = parseInt(searchParams.get("ano") || "2026");

  if (mes < 1 || mes > 12) {
    return NextResponse.json({ error: "Mês inválido" }, { status: 400 });
  }

  if (ano < 2020 || ano > 2030) {
    return NextResponse.json({ error: "Ano inválido" }, { status: 400 });
  }

  const dataInicio = new Date(ano, mes - 1, 1);
  const dataFim = new Date(ano, mes, 0, 23, 59, 59, 999);

  const data = await getRelatorioPeriodo({ dataInicio, dataFim });
  return NextResponse.json(data);
}

