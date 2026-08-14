// ---------------------------------------------------------------------------
// Serviço de Diagnóstico Assistido por IA (Portal do Médico)
//
// Orquestra a análise de imagens de um exame:
//   1. Valida o exame e as imagens (autorização no server action).
//   2. Invoca o motor de IA (ml-service → /api/ia/analisar → FastAPI).
//   3. Normaliza o resultado para o modelo de dados `AnaliseIA`.
//   4. Persiste a análise e devolve o resultado normalizado.
//
// ⚠️ Segurança clínica: a IA produz apenas hipóteses de APOIO à decisão.
// O diagnóstico definitivo pertence sempre ao médico especialista.
// ---------------------------------------------------------------------------

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { diagnosticarImagemServer } from "@/features/imagens/services/ml-service";
import { gerarComGemini, geminiConfigurado } from "@/services/gemini.service";
import type { MLAchado } from "@/features/imagens/types";
import type { AnaliseIA, ResultadoAnaliseIA, AchadoIA } from "@/features/medico/types/ia";

/**
 * Converte um resultado do motor de IA (MLDiagnostico) para o formato
 * normalizado `ResultadoAnaliseIA` usado pela UI e pela persistência.
 */
export function normalizarResultadoIA(
  resultado: {
    diagnosticoPrincipal: string | null;
    confiancaDiagnostico: number;
    achados: Array<{ tipo: string; descricao?: string; confianca: number; gravidade?: string }>;
    resumo: string;
    recomendacoes?: string[];
    processadoEm?: string;
    regioesInteresse?: Array<{
      x: number;
      y: number;
      largura: number;
      altura: number;
      tipo: string;
      confianca: number;
    }>;
  }
): ResultadoAnaliseIA {
  const achados: AchadoIA[] = (resultado.achados || []).map((a) => ({
    nome: a.tipo,
    probabilidade: a.confianca ?? 0,
    presente: (a.confianca ?? 0) > 50,
    descricao: a.descricao,
  }));

  // Mapeia as regiões de interesse (regioesInteresse) para o formato usado
  // pelo HeatmapViewer (campo `regioes`), para que sejam exibidas na imagem.
  const regioes = (resultado.regioesInteresse || []).map((r) => ({
    x: r.x,
    y: r.y,
    largura: r.largura,
    altura: r.altura,
    tipo: r.tipo,
    confianca: r.confianca,
  }));

  return {
    diagnostico: resultado.diagnosticoPrincipal || "Sem alterações significativas",
    confidence: resultado.confiancaDiagnostico ?? 0,
    findings: achados,
    summary: resultado.resumo || "",
    model: "TorchXRayVision",
    preLaudo: gerarPreLaudo(resultado),
    regioes,
  };
}

/**
 * Gera um texto-base de pré-laudo a partir do resultado da IA.
 * Serve de ponto de partida editável para o médico.
 */
export function gerarPreLaudo(resultado: {
  diagnosticoPrincipal: string | null;
  confiancaDiagnostico: number;
  achados: Array<{ tipo: string; descricao?: string; gravidade?: string }>;
  resumo: string;
}): string {
  const linhas: string[] = [];

  linhas.push("DESCRIÇÃO:");
  linhas.push((resultado.resumo || "").trim() || "Sem descrição automática disponível.");
  linhas.push("");

  if (resultado.achados && resultado.achados.length > 0) {
    linhas.push("ACHADOS:");
    for (const a of resultado.achados) {
      const gravidade = a.gravidade ? ` [${a.gravidade}]` : "";
      linhas.push(`- ${a.tipo}${gravidade}${a.descricao ? `: ${a.descricao}` : ""}`);
    }
    linhas.push("");
  }

  linhas.push("CONCLUSÃO:");
  linhas.push(
    resultado.diagnosticoPrincipal
      ? `Sugestão automática: ${resultado.diagnosticoPrincipal} (confiança ${Math.round(
          resultado.confiancaDiagnostico
        )}%). Correlacionar com o quadro clínico.`
      : "Sem alterações significativas detectadas automaticamente."
  );
  linhas.push("");
  linhas.push(
    "NOTA: Texto gerado por IA como apoio à decisão. Sujeito a revisão e validação clínica pelo médico responsável antes de assinatura."
  );

  return linhas.join("\n");
}

/**
 * Gera um pré-laudo clínico enriquecido com o Google Gemini, com base no
 * resultado normalizado do motor de visão (diagnóstico, achados, resumo).
 *
 * Usa dados anonimizados (sem identificação do paciente) e instrução de
 * sistema com salvaguardas de segurança clínica. Devolve o texto do pré-laudo
 * ou `null` se o Gemini não estiver configurado ou falhar — nesse caso o
 * chamador deve usar o `gerarPreLaudo()` estático como fallback.
 */
export async function gerarPreLaudoComGemini(dados: {
  diagnostico: string;
  confianca: number;
  achados: AchadoIA[];
  resumo: string;
  modalidade?: string;
  recomendacoes?: string[];
}): Promise<string | null> {
  if (!geminiConfigurado()) {
    return null;
  }

  const achadosTexto = (dados.achados || [])
    .map(
      (a) =>
        `- ${a.nome}${a.probabilidade > 0 ? ` (probabilidade ${Math.round(a.probabilidade)}%)` : ""}${
          a.presente ? " — presente" : " — não evidenciado"
        }${a.descricao ? `: ${a.descricao}` : ""}`
    )
    .join("\n");

  const modalidade = dados.modalidade || "Imagiologia";

  const prompt = [
    `TIPO DE EXAME / MODALIDADE: ${modalidade}`,
    `DIAGNÓSTICO SUGERIDO (pelo motor de visão): ${dados.diagnostico}`,
    `CONFIANÇA: ${Math.round(dados.confianca)}%`,
    "",
    "ACHADOS:",
    achadosTexto || "- Nenhum achado específico.",
    "",
    "RESUMO:",
    dados.resumo || "Sem resumo automático.",
    "",
    ...(dados.recomendacoes?.length
      ? ["RECOMENDAÇÕES:", ...dados.recomendacoes.map((r) => `- ${r}`), ""]
      : []),
    "Escreve um pré-laudo radiológico estruturado em português de Portugal, com secções:",
    "1) DESCRIÇÃO (técnica e achados)",
    "2) ACHADOS (listados com localização e carácter)",
    "3) CONCLUSÃO (síntese clínica, sem diagnóstico definitivo)",
    "4) NOTA (recomendação de correlação clínica e que é um texto de apoio)",
    "",
    "Regras obrigatórias:",
    "- NÃO inventar achados; basear-te APENAS nos dados fornecidos acima.",
    "- Não usar identificação do paciente (anonimizado).",
    "- Usar linguagem clínica profissional e prudente.",
    "- Todas as conclusões devem ser apresentadas como SUGESTÃO de apoio à decisão.",
  ].join("\n");

  const systemInstruction = [
    "És um assistente radiológico de APOIO à decisão clínica.",
    "Nunca apresentas um diagnóstico definitivo — apenas hipóteses e sugestões a validar por um médico especialista.",
    "Responde sempre em português de Portugal.",
    "Não inventas informação clínica que não esteja fornecida no prompt.",
  ].join("\n");

  try {
    const texto = await gerarComGemini(prompt, systemInstruction, {
      temperatura: 0.3,
      maxOutputTokens: 2048,
    });
    if (!texto.trim()) return null;
    return texto;
  } catch (err) {
    console.error("Falha ao gerar pré-laudo com Gemini, a usar fallback estático:", err);
    return null;
  }
}

/**
 * Gera um diagnóstico clínico enriquecido com o Google Gemini, com base no
 * resultado do motor de visão (diagnóstico, achados, resumo, modalidade).
 *
 * Devolve um objeto com o diagnóstico reformulado, um resumo contextualizado
 * e as descrições dos achados enriquecidas — ou `null` se o Gemini não estiver
 * configurado ou falhar (nesse caso o chamador mantém os valores originais).
 *
 * ⚠️ Segurança clínica: pede-se ao Gemini que reformule/explicite APENAS com
 * base nos dados fornecidos, sem inventar achados e sem identificação do
 * paciente. As conclusões são sempre apresentadas como sugestão de apoio.
 */
export async function gerarDiagnosticoComGemini(dados: {
  diagnostico: string;
  confianca: number;
  achados: AchadoIA[];
  resumo: string;
  modalidade?: string;
}): Promise<{
  diagnostico: string;
  resumo: string;
  achados: Array<{ nome: string; descricao?: string }>;
} | null> {
  if (!geminiConfigurado()) {
    return null;
  }

  const achadosTexto = (dados.achados || [])
    .map(
      (a) =>
        `- ${a.nome}${a.probabilidade > 0 ? ` (probabilidade ${Math.round(a.probabilidade)}%)` : ""}${a.descricao ? `: ${a.descricao}` : ""}`
    )
    .join("\n");

  const modalidade = dados.modalidade || "Imagiologia";

  const prompt = [
    `TIPO DE EXAME / MODALIDADE: ${modalidade}`,
    `DIAGNÓSTICO SUGERIDO (pelo motor de visão): ${dados.diagnostico}`,
    `CONFIANÇA: ${Math.round(dados.confianca)}%`,
    "",
    "ACHADOS:",
    achadosTexto || "- Nenhum achado específico.",
    "",
    "RESUMO:",
    dados.resumo || "Sem resumo automático.",
    "",
    "Com base exclusivamente nos dados acima, devolve um JSON válido com exatamente esta estrutura:",
    '{ "diagnostico": "diagnóstico reformulado de forma clínica e prudente", "resumo": "resumo contextualizado em 2-3 frases", "achados": [ { "nome": "achado original", "descricao": "descrição clínica enriquecida" } ] }',
    "",
    "Regras obrigatórias:",
    "- NÃO inventar achados, diagnósticos ou informação clínica que não estejam fornecidos acima.",
    "- Não usar identificação de paciente (anonimizado).",
    "- Usar linguagem clínica profissional e prudente em português de Portugal.",
    "- Apresentar o diagnóstico como SUGESTÃO de apoio à decisão, não como certeza.",
    "- Devolver APENAS o JSON, sem comentários adicionais.",
  ].join("\n");

  const systemInstruction = [
    "És um assistente radiológico de APOIO à decisão clínica.",
    "Reformulas e contextualizas o diagnóstico e os achados fornecidos por um motor de visão, sem inventar informação.",
    "Nunca apresentas um diagnóstico definitivo — apenas hipóteses e sugestões a validar por um médico especialista.",
    "Responde sempre em português de Portugal e devolves apenas JSON válido.",
  ].join("\n");

  try {
    const texto = await gerarComGemini(prompt, systemInstruction, {
      temperatura: 0.3,
      maxOutputTokens: 1024,
    });

    // Extrai o JSON do texto (o Gemini pode envolver em ```json ... ```)
    const jsonStr = texto.replace(/```json|```/g, "").trim();
    const inicioJson = jsonStr.indexOf("{");
    const fimJson = jsonStr.lastIndexOf("}");
    if (inicioJson === -1 || fimJson === -1) return null;

    const parsed = JSON.parse(jsonStr.slice(inicioJson, fimJson + 1));
    if (!parsed || typeof parsed !== "object") return null;

    return {
      diagnostico:
        typeof parsed.diagnostico === "string" && parsed.diagnostico.trim()
          ? parsed.diagnostico.trim()
          : dados.diagnostico,
      resumo: typeof parsed.resumo === "string" && parsed.resumo.trim() ? parsed.resumo.trim() : dados.resumo,
      achados: Array.isArray(parsed.achados)
        ? parsed.achados
            .filter((a: unknown) => a && typeof (a as { nome?: string }).nome === "string")
            .map((a: { nome: string; descricao?: string }) => ({
              nome: a.nome,
              descricao: typeof a.descricao === "string" ? a.descricao : undefined,
            }))
        : dados.achados.map((a) => ({ nome: a.nome, descricao: a.descricao })),
    };
  } catch (err) {
    console.error("Falha ao gerar diagnóstico com Gemini, a manter valores do motor de visão:", err);
    return null;
  }
}

/**
 * Gera um resumo clínico comparativo entre dois exames com o Google Gemini,
 * com base nos diagnósticos do motor de visão (exame anterior e atual).
 *
 * Enquanto a comparação heurística enumera os achados que mudaram, o Gemini
 * produz uma síntese clínica mais rica e contextualizada (evolução, tendência,
 * risco e recomendações), sempre como apoio à decisão e sem inventar dados.
 *
 * Devolve o texto do resumo comparativo ou `null` se o Gemini não estiver
 * configurado ou falhar — nesse caso o chamador mantém o resumo heurístico.
 */
export async function compararExamesComGemini(dados: {
  exameAnterior: { data: string; tipo: string; diagnostico: string; confianca: number; achados: AchadoIA[] };
  exameAtual: { data: string; tipo: string; diagnostico: string; confianca: number; achados: AchadoIA[] };
}): Promise<{ resumo: string; achadosMudaram: string[] } | null> {
  if (!geminiConfigurado()) {
    return null;
  }

  const formatarExame = (e: typeof dados.exameAnterior, rotulo: string) => {
    const achados = (e.achados || [])
      .map(
        (a) =>
          `- ${a.nome}${a.probabilidade > 0 ? ` (probabilidade ${Math.round(a.probabilidade)}%)` : ""}${a.descricao ? `: ${a.descricao}` : ""}`
      )
      .join("\n");
    return [
      `${rotulo}: ${e.tipo} (${e.data})`,
      `  Diagnóstico sugerido: ${e.diagnostico}`,
      `  Confiança: ${Math.round(e.confianca)}%`,
      "  Achados:",
      achados || "    - Nenhum achado específico.",
    ].join("\n");
  };

  const prompt = [
    formatarExame(dados.exameAnterior, "EXAME ANTERIOR"),
    "",
    formatarExame(dados.exameAtual, "EXAME ATUAL"),
    "",
    "Com base exclusivamente nos dados acima, devolve um JSON válido com exatamente esta estrutura:",
    '{ "resumo": "síntese clínica comparativa em 3-5 frases, abordando a evolução entre os dois exames, tendência e risco clínico", "achadosMudaram": ["frase objetiva sobre cada alteração relevante entre exames"] }',
    "",
    "Regras obrigatórias:",
    "- NÃO inventar achados, diagnósticos ou informação clínica que não estejam fornecidos acima.",
    "- Não usar identificação de paciente (anonimizado).",
    "- Usar linguagem clínica profissional e prudente em português de Portugal.",
    "- Apresentar tudo como SUGESTÃO de apoio à decisão, nunca como certeza.",
    "- Devolver APENAS o JSON, sem comentários adicionais.",
  ].join("\n");

  const systemInstruction = [
    "És um assistente radiológico de APOIO à decisão clínica, especializado em comparar exames de imagem ao longo do tempo.",
    "Avalias a evolução entre um exame anterior e um atual, identificando tendências e riscos, sem inventar informação.",
    "Nunca apresentas um diagnóstico definitivo — apenas hipóteses e sugestões a validar por um médico especialista.",
    "Responde sempre em português de Portugal e devolves apenas JSON válido.",
  ].join("\n");

  try {
    const texto = await gerarComGemini(prompt, systemInstruction, {
      temperatura: 0.3,
      maxOutputTokens: 1024,
    });

    const jsonStr = texto.replace(/```json|```/g, "").trim();
    const inicioJson = jsonStr.indexOf("{");
    const fimJson = jsonStr.lastIndexOf("}");
    if (inicioJson === -1 || fimJson === -1) return null;

    const parsed = JSON.parse(jsonStr.slice(inicioJson, fimJson + 1));
    if (!parsed || typeof parsed !== "object") return null;

    return {
      resumo:
        typeof parsed.resumo === "string" && parsed.resumo.trim()
          ? parsed.resumo.trim()
          : "",
      achadosMudaram: Array.isArray(parsed.achadosMudaram)
        ? parsed.achadosMudaram.filter((a: unknown) => typeof a === "string")
        : [],
    };
  } catch (err) {
    console.error("Falha ao comparar exames com Gemini, a manter resumo heurístico:", err);
    return null;
  }
}

/**
 * Executa a análise de IA sobre uma imagem de um exame e persiste o resultado.
 * A autorização é feita pela server action que invoca esta função.
 *
 * NOTA: esta função corre em Node.js (server). Usa diagnóstico server-safe
 * (`diagnosticarImagemServer`) com os bytes da imagem, em vez de APIs de
 * browser (canvas/Image) que não existem no servidor.
 */
export async function analisarImagemComIA(
  exameId: number,
  imagem: { id: number; path: string; dados?: Uint8Array | Buffer | null },
  utilizadorId: number | null,
  nomeTipoExame?: string
): Promise<AnaliseIA> {
  const inicio = Date.now();

  // 1. Invoca o motor de IA direto com os bytes da imagem (server-safe)
  const bytes = imagem.dados ? Buffer.from(imagem.dados) : Buffer.from([]);
  const resultado = await diagnosticarImagemServer(imagem.id, bytes, nomeTipoExame);

  // 2. Normaliza para o formato persistido
  const normalizado = normalizarResultadoIA({
    diagnosticoPrincipal: resultado.diagnosticoPrincipal,
    confiancaDiagnostico: resultado.confiancaDiagnostico,
    achados: (resultado.achados || []).map((a: MLAchado) => ({
      tipo: a.tipo,
      descricao: a.descricao,
      confianca: a.confianca,
      gravidade: a.gravidade,
    })),
    resumo: resultado.resumo,
    recomendacoes: resultado.recomendacoes,
    regioesInteresse: resultado.regioesInteresse,
  });

  const tempoProcessamento = (Date.now() - inicio) / 1000;

  // Motor usado para o diagnóstico/findings (gemini ou motor de visão).
  let motorDiagnostico = "regras";

  // 2a. Tenta enriquecer o diagnóstico, o resumo e as descrições dos achados
  //     com o Google Gemini (com fallback para os valores do motor de visão).
  const enriquecido = await gerarDiagnosticoComGemini({
    diagnostico: normalizado.diagnostico,
    confianca: normalizado.confidence,
    achados: normalizado.findings,
    resumo: normalizado.summary,
    modalidade: nomeTipoExame,
  });

  if (enriquecido) {
    motorDiagnostico = "gemini";
    normalizado.diagnostico = enriquecido.diagnostico;
    normalizado.summary = enriquecido.resumo;
    normalizado.findings = normalizado.findings.map((f) => {
      const enr = enriquecido.achados.find((a) => a.nome.toLowerCase() === f.nome.toLowerCase());
      return enr?.descricao
        ? { ...f, descricao: enr.descricao }
        : f;
    });
  }

  // 2b. Tenta gerar um pré-laudo clínico enriquecido com o Google Gemini
  //     (com fallback para o texto estático `gerarPreLaudo` quando não estiver
  //     configurado ou se a API falhar).
  let preLaudo = normalizado.preLaudo;
  let motorPreLaudo = "regras";
  const preLaudoGemini = await gerarPreLaudoComGemini({
    diagnostico: normalizado.diagnostico,
    confianca: normalizado.confidence,
    achados: normalizado.findings,
    resumo: normalizado.summary,
    modalidade: nomeTipoExame,
    recomendacoes: resultado.recomendacoes,
  });
  if (preLaudoGemini) {
    preLaudo = preLaudoGemini;
    motorPreLaudo = "gemini";
  }

  // 3. Persiste
  const analise = await prisma.analiseIA.create({
    data: {
      exameId,
      utilizadorId: utilizadorId ?? null,
      imagemId: imagem.id,
      modelo: "TorchXRayVision",
      diagnosticoPrincipal: normalizado.diagnostico,
      confianca: normalizado.confidence,
      achados: normalizado.findings as unknown as Prisma.InputJsonValue,
      resumo: normalizado.summary,
      resultadoJson: {
        ...normalizado,
        motorPreLaudo,
        motorDiagnostico,
      } as unknown as Prisma.InputJsonValue,
      preLaudo,
      status: "concluido",
      tempoProcessamento,
    },
    include: { utilizador: { select: { id: true, nome: true } } },
  });

  return serializarAnalise(analise);
}

/**
 * Analisa todas as imagens de um exame (ou uma imagem específica) com IA.
 * Usada pela página de Diagnóstico IA.
 */
export async function analisarExameComIA(
  exameId: number,
  utilizadorId: number | null,
  imagemId?: number
): Promise<AnaliseIA[]> {
  const exame = await prisma.exame.findUnique({
    where: { id: exameId },
    include: {
      tipoExame: { select: { nome: true, modalidade: true } },
imagens: {
        where: imagemId ? { id: imagemId } : {},
        select: { id: true, exameId: true, filename: true, originalName: true, mimeType: true, tamanho: true, path: true, dados: true, createdAt: true },
      },
    },
  });

  if (!exame) throw new Error("Exame não encontrado");
  if (exame.imagens.length === 0) throw new Error("O exame não tem imagens para analisar");

  const nomeTipoExame = exame.tipoExame?.nome || exame.tipoExame?.modalidade || undefined;
  const resultados: AnaliseIA[] = [];

  for (const imagem of exame.imagens) {
    try {
      const resultado = await analisarImagemComIA(exameId, imagem, utilizadorId, nomeTipoExame);
      resultados.push(resultado);
    } catch (err) {
      console.error(`Erro ao analisar imagem ${imagem.id}:`, err);
    }
  }

  return resultados;
}

/**
 * Lista o histórico de análises de IA de um exame.
 */
export async function listarAnalisesIA(exameId: number, limit = 50): Promise<AnaliseIA[]> {
  const data = await prisma.analiseIA.findMany({
    where: { exameId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { utilizador: { select: { id: true, nome: true } } },
  });

  return data.map(serializarAnalise);
}

/**
 * Obtém a análise mais recente de um exame (para a página de diagnóstico).
 */
export async function obterAnaliseMaisRecente(exameId: number): Promise<AnaliseIA | null> {
  const data = await prisma.analiseIA.findFirst({
    where: { exameId },
    orderBy: { createdAt: "desc" },
    include: { utilizador: { select: { id: true, nome: true } } },
  });

  return data ? serializarAnalise(data) : null;
}

/**
 * Atualiza o pré-laudo de uma análise (texto editável pelo médico).
 */
export async function atualizarPreLaudoIA(analiseId: number, preLaudo: string): Promise<AnaliseIA> {
  const data = await prisma.analiseIA.update({
    where: { id: analiseId },
    data: { preLaudo },
    include: { utilizador: { select: { id: true, nome: true } } },
  });

  return serializarAnalise(data);
}

// ---------------------------------------------------------------------------
// Helpers de serialização
// ---------------------------------------------------------------------------

function serializarAnalise(
  a: {
    id: number;
    exameId: number;
    utilizadorId: number | null;
    imagemId: number | null;
    modelo: string;
    diagnosticoPrincipal: string | null;
    confianca: number;
    achados: unknown;
    resumo: string;
    resultadoJson: unknown;
    heatmap: string | null;
    preLaudo: string | null;
    status: string;
    tempoProcessamento: number;
    createdAt: Date;
    updatedAt: Date;
    utilizador?: { id: number; nome: string } | null;
  }
): AnaliseIA {
  return {
    id: a.id,
    exameId: a.exameId,
    utilizadorId: a.utilizadorId,
    imagemId: a.imagemId,
    modelo: a.modelo,
    diagnosticoPrincipal: a.diagnosticoPrincipal,
    confianca: a.confianca,
    achados: (a.achados as AchadoIA[]) || [],
    resumo: a.resumo,
    resultadoJson: (a.resultadoJson as ResultadoAnaliseIA) || {},
    heatmap: a.heatmap,
    preLaudo: a.preLaudo,
    status: (a.status as AnaliseIA["status"]) || "concluido",
    tempoProcessamento: a.tempoProcessamento,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    utilizador: a.utilizador,
  };
}
