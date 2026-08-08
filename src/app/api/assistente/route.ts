import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { gerarComGemini, geminiConfigurado } from "@/services/gemini.service";

export const dynamic = "force-dynamic";

/**
 * Ponto único do assistente flutuante do sistema.
 *
 * Recebe uma pergunta do utilizador e devolve uma resposta gerada pelo
 * Gemini, enriquecida com contexto real da base de dados (pacientes,
 * exames, agendamentos, etc.) de forma anonimizada.
 *
 * Se o Gemini não estiver configurado, devolve uma resposta baseada em
 * regras (pesquisa interna) para que o assistente nunca fique "morto".
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: { pergunta?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const pergunta = body.pergunta?.trim();
  if (!pergunta) {
    return NextResponse.json({ error: "Pergunta vazia" }, { status: 400 });
  }

  try {
    // 1. Recolhe contexto real da base de dados (anonimizado e limitado)
    const contexto = await obterContexto(pergunta);

    // 2. Se o Gemini estiver configurado, gera resposta rica com IA
    if (geminiConfigurado()) {
      try {
        const resposta = await gerarComGemini(
          [
            `PERGUNTA DO UTILIZADOR: "${pergunta}"`,
            "",
            "CONTEXTO REAL DO SISTEMA (dados atuais, anonimizados):",
            contexto,
            "",
            "Responde em português de Portugal, de forma concisa e útil para um profissional de saúde que usa um sistema de gestão de imagiologia.",
            "Usa os dados fornecidos sempre que forem relevantes para a pergunta. Se não souberes, diz que precisas de mais informação.",
          ].join("\n"),
          [
            "És o assistente virtual do Sistema de Gestão de Imagiologia.",
            "Ajudas profissionais de saúde a navegar e usar o sistema: pacientes, exames, agendamentos, técnicos, tipos de exame, histórico, etc.",
            "Respondes em português de Portugal, de forma clara e profissional.",
            "Usas apenas os dados fornecidos no contexto; nunca inventas informação.",
            "Se a pergunta não for clara, pedes esclarecimento.",
          ].join("\n"),
          { temperatura: 0.4, maxOutputTokens: 1024 }
        );
        return NextResponse.json({ resposta });
      } catch {
        // fallback para regras abaixo
      }
    }

    // 3. Fallback baseado em regras (sem Gemini)
    return NextResponse.json({ resposta: gerarRespostaRegras(pergunta, contexto) });
  } catch (error) {
    console.error("Erro no assistente:", error);
    return NextResponse.json(
      { error: "Erro ao processar o pedido" },
      { status: 500 }
    );
  }
}

/** Recolhe dados reais relevantes da base de dados, de forma anonimizada. */
async function obterContexto(pergunta: string): Promise<string> {
  const q = pergunta.toLowerCase();
  const blocos: string[] = [];

  try {
    const [totalPacientes, totalExames, examesRecentes, examesSolicitados, tecnicos, tiposExame, turnos] =
      await Promise.all([
        prisma.paciente.count(),
        prisma.exame.count(),
        prisma.exame.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            codigo: true,
            estado: true,
            dataExame: true,
            paciente: { select: { nome: true } },
            tipoExame: { select: { nome: true } },
          },
        }),
        prisma.exame.findMany({
          where: { estado: "Solicitado" },
          orderBy: { dataExame: "asc" },
          take: 5,
          select: {
            id: true,
            codigo: true,
            dataExame: true,
            paciente: { select: { nome: true } },
            tipoExame: { select: { nome: true } },
          },
        }),
        prisma.tecnico.findMany({ take: 5, select: { nome: true, especialidade: true } }),
        prisma.tipoExame.findMany({ take: 5, select: { nome: true, modalidade: true } }),
        prisma.turno.findMany({
          orderBy: { data: "desc" },
          take: 5,
          select: {
            data: true,
            tipo: true,
            tecnico: { select: { nome: true } },
          },
        }),
      ]);

    if (q.includes("paciente") || q.includes("quantos") || q.includes("total") || q.includes("registado")) {
      blocos.push(`Total de pacientes registados: ${totalPacientes}.`);
    }
    if (q.includes("exame") || q.includes("quantos") || q.includes("total")) {
      blocos.push(`Total de exames no sistema: ${totalExames}.`);
      if (examesRecentes.length) {
        const recentes = examesRecentes
          .map((e) => `${e.codigo || `#${e.id}`} (${e.tipoExame?.nome || "—"}, ${e.estado}) — ${e.paciente?.nome || "sem paciente"}`)
          .join("; ");
        blocos.push(`Exames recentes: ${recentes}.`);
      }
    }
    if (q.includes("solicitado") || q.includes("pendente") || q.includes("agendado") || q.includes("marcado") || q.includes("fila")) {
      if (examesSolicitados.length) {
        const solicitados = examesSolicitados
          .map((e) => `${e.codigo || `#${e.id}`} (${e.tipoExame?.nome || "—"}) — ${e.paciente?.nome || "sem paciente"} — ${e.dataExame.toISOString().slice(0, 10)}`)
          .join("; ");
        blocos.push(`Exames solicitados/agendados: ${solicitados}.`);
      } else {
        blocos.push("Não há exames solicitados pendentes.");
      }
    }
    if (q.includes("técnico") || q.includes("tecnico") || q.includes("equipa")) {
      if (tecnicos.length) {
        blocos.push(`Técnicos: ${tecnicos.map((t) => `${t.nome} (${t.especialidade || "—"})`).join("; ")}.`);
      }
    }
    if (q.includes("tipo de exame") || q.includes("modalidade")) {
      if (tiposExame.length) {
        blocos.push(`Tipos de exame: ${tiposExame.map((t) => `${t.nome} (${t.modalidade || "—"})`).join("; ")}.`);
      }
    }
    if (q.includes("turno") || q.includes("escala")) {
      if (turnos.length) {
        blocos.push(`Turnos recentes: ${turnos.map((t) => `${t.data.toISOString().slice(0, 10)} (${t.tipo}) — ${t.tecnico?.nome || "sem técnico"}`).join("; ")}.`);
      }
    }

    if (blocos.length === 0) {
      blocos.push(
        `O sistema tem ${totalPacientes} pacientes e ${totalExames} exames. ` +
          `Oferece funcionalidades de gestão de pacientes, exames, técnicos, tipos de exame, histórico, turnos, relatórios e análise por IA.`
      );
    }
  } catch (err) {
    console.error("Erro ao obter contexto do assistente:", err);
  }

  return blocos.join("\n") || "Sem dados disponíveis.";
}

/** Resposta por regras usada quando o Gemini não está configurado. */
function gerarRespostaRegras(pergunta: string, contexto: string): string {
  const q = pergunta.toLowerCase();

  if (q.includes("olá") || q.includes("ola") || q.includes("bom dia") || q.includes("boa tarde") || q.includes("boa noite")) {
    return "Olá! 👋 Sou o assistente do Sistema de Gestão de Imagiologia. Posso ajudar com pacientes, exames, técnicos, turnos, relatórios e muito mais. Em que posso ajudar?";
  }

  if (q.includes("paciente")) {
    return `Sobre pacientes:\n\n${contexto}\n\nPode registar, editar e consultar pacientes na secção "Pacientes" do menu lateral.`;
  }

  if (q.includes("exame")) {
    return `Sobre exames:\n\n${contexto}\n\nPode consultar e gerir exames na secção "Exames" do menu lateral.`;
  }

  if (q.includes("técnico") || q.includes("tecnico")) {
    return `Sobre técnicos:\n\n${contexto}\n\nPode gerir a equipa técnica na secção "Técnicos" do menu lateral.`;
  }

  if (q.includes("turno") || q.includes("escala")) {
    return `Sobre turnos:\n\n${contexto}\n\nPode gerir a escala de turnos na secção "Turnos" do menu lateral.`;
  }

  if (q.includes("relatório") || q.includes("relatorio") || q.includes("estatística") || q.includes("estatistica")) {
    return "Pode gerar relatórios e estatísticas na secção 'Relatórios' do menu lateral. Lá encontra opções de exportação e análise de dados.";
  }

  if (q.includes("ajuda") || q.includes("como uso") || q.includes("como funciona")) {
    return "Sou o assistente do sistema. Posso ajudar a:\n\n• Encontrar pacientes e exames\n• Verificar agendamentos\n• Gerir técnicos e tipos de exame\n• Gerar relatórios\n• Navegar nas funcionalidades\n\nBasta perguntar!";
  }

  if (q.includes("obrigado") || q.includes("obrigada")) {
    return "De nada! 😊 Estou aqui para ajudar sempre que precisar.";
  }

  return `Aqui está o que encontrei:\n\n${contexto}\n\nPode consultar os detalhes nas respetivas secções do menu lateral. Se precisar de algo mais específico, pergunte!`;
}