import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/fila/painel
 * Rota pública (sem autenticação) usada pelo painel da sala de espera.
 * Retorna os últimos chamados nas filas CONSULTA e URGÊNCIA.
 */
export async function GET() {
  try {
    const chamados = await prisma.filaAtendimento.findMany({
      where: {
        status: "CHAMADO",
        chamadoEm: { not: null },
      },
      orderBy: { chamadoEm: "desc" },
      take: 10,
      include: {
        atendimento: {
          select: {
            id: true,
            codigo: true,
            tipo: true,
            prioridade: true,
            paciente: { select: { nome: true, numeroProcesso: true } },
            especialidade: { select: { nome: true } },
            consultorio: { select: { numero: true, nome: true, andar: true, bloco: true } },
            senha: { select: { codigo: true, chamadaEm: true } },
          },
        },
      },
    });

    const agora = new Date();
    const payload = chamados.map((item) => ({
      id: item.id,
      tipoFila: item.tipoFila,
      posicao: item.posicao,
      chamadoEm: item.chamadoEm,
      senha: item.atendimento.senha?.codigo ?? item.atendimento.codigo,
      paciente: item.atendimento.paciente.nome,
      numeroProcesso: item.atendimento.paciente.numeroProcesso,
      especialidade: item.atendimento.especialidade?.nome ?? "Atendimento clínico",
      consultorio: item.atendimento.consultorio
        ? {
            numero: item.atendimento.consultorio.numero,
            nome: item.atendimento.consultorio.nome,
            andar: item.atendimento.consultorio.andar,
            bloco: item.atendimento.consultorio.bloco,
          }
        : null,
      prioridade: item.atendimento.prioridade,
      secsAtras: Math.round((agora.getTime() - new Date(item.chamadoEm!).getTime()) / 1000),
    }));

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar painel" }, { status: 500 });
  }
}
