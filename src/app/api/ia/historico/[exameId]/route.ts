import { NextRequest, NextResponse } from "next/server";
import { autorizarApi } from "@/lib/permissions-server";
import { prisma } from "@/lib/db";

/**
 * GET /api/ia/historico/[exameId]
 * Devolve o histórico de análises de IA de um exame.
 * Acesso restrito a utilizadores com permissão no módulo "medico".
 */
type Params = { params: Promise<{ exameId: string }> };

export async function GET(
  _req: NextRequest,
  { params }: Params
) {
  // Guard de permissões via API
  const erro = await autorizarApi("medico");
  if (erro) return erro;

  const { exameId: exameIdStr } = await params;
  const exameId = Number(exameIdStr);
  if (!exameId || Number.isNaN(exameId)) {
    return NextResponse.json({ error: "ID de exame inválido" }, { status: 400 });
  }

  try {
    const analises = await prisma.analiseIA.findMany({
      where: { exameId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { utilizador: { select: { id: true, nome: true } } },
    });

    return NextResponse.json({
      data: analises.map((a) => ({
        id: a.id,
        exameId: a.exameId,
        utilizadorId: a.utilizadorId,
        imagemId: a.imagemId,
        modelo: a.modelo,
        diagnosticoPrincipal: a.diagnosticoPrincipal,
        confianca: a.confianca,
        achados: a.achados,
        resumo: a.resumo,
        resultadoJson: a.resultadoJson,
        heatmap: a.heatmap,
        preLaudo: a.preLaudo,
        status: a.status,
        tempoProcessamento: a.tempoProcessamento,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        utilizador: a.utilizador,
      })),
    });
  } catch (err) {
    console.error("Erro ao listar análises de IA:", err);
    return NextResponse.json(
      { error: "Erro ao listar análises de IA" },
      { status: 500 }
    );
  }
}
