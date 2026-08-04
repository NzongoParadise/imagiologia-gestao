import { NextRequest, NextResponse } from "next/server";
import { getRelatorioPeriodo } from "@/server/actions/relatorios-actions";
import { autorizarApi } from "@/lib/permissions-server";

export async function GET(request: NextRequest) {
  const erro = await autorizarApi("relatorios");
  if (erro) return erro;


  const { searchParams } = new URL(request.url);
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");
  const estado = searchParams.get("estado") || undefined;
  const procedenciaId = searchParams.get("procedenciaId")
    ? parseInt(searchParams.get("procedenciaId")!)
    : undefined;
  const tecnicoId = searchParams.get("tecnicoId")
    ? parseInt(searchParams.get("tecnicoId")!)
    : undefined;
  const tipoExameId = searchParams.get("tipoExameId")
    ? parseInt(searchParams.get("tipoExameId")!)
    : undefined;

  if (!dataInicio || !dataFim) {
    return NextResponse.json(
      { error: "dataInicio e dataFim são obrigatórios" },
      { status: 400 }
    );
  }

  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);

  if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
    return NextResponse.json(
      { error: "Datas inválidas" },
      { status: 400 }
    );
  }

  fim.setHours(23, 59, 59, 999);

  const data = await getRelatorioPeriodo({
    dataInicio: inicio,
    dataFim: fim,
    estado: estado === "todos" ? undefined : estado,
    procedenciaId,
    tecnicoId,
    tipoExameId,
  });

  return NextResponse.json(data);
}

