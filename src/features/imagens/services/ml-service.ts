import type {
  MLDiagnostico,
  MLAchado,
  MLRegiao,
  MLMetadados,
  AchadoCategoria,
} from "../types";

/**
 * Serviço de análise de imagens com IA.
 *
 * Estratégia:
 *  1. Tenta chamar o backend de IA real (TorchXRayVision) via /api/ia/analisar.
 *     Este endpoint é um proxy para o serviço Python (variável AI_BACKEND_URL).
 *  2. Se o backend não estiver configurado/disponível, usa uma análise local
 *     heurística (brilho/contraste/simetria) como FALLBACK de demonstração.
 *
 * ⚠️ Segurança clínica: ambas as vias produzem apenas hipóteses de APOIO.
 * O diagnóstico definitivo deve ser feito por médico especialista.
 */

// =========================================================================
// Tipos auxiliares
// =========================================================================
interface MetadadosCalculados {
  brilhoMedio: number;
  nitidez: number;
  contraste: number;
  histograma: number[];
  razaoAspecto: number;
}

// =========================================================================
// Fallback heurístico (análise local de brilho/contraste/simetria)
// NOTA: mantido apenas para demonstração sem backend. Não é diagnóstico médico.
// =========================================================================
const DIAGNOSTICOS_POR_MODALIDADE: Record<string, Array<{
  nome: string;
  descricao: string;
  categoria: AchadoCategoria;
  gravidade: "leve" | "moderado" | "severo";
  limiarBrilho: [number, number];
  limiarContraste: number;
  simetriaEsperada: boolean;
}>> = {
  "Raio-X": [
    {
      nome: "Pneumonia",
      descricao: "Opacidade pulmonar com broncogramas aereos sugestiva de pneumonia (heurística de demonstração)",
      categoria: "opacidade",
      gravidade: "moderado",
      limiarBrilho: [30, 60],
      limiarContraste: 40,
      simetriaEsperada: false,
    },
    {
      nome: "Derrame Pleural",
      descricao: "Opacidade homogenea no recesso costofrenico (heurística de demonstração)",
      categoria: "derrame",
      gravidade: "moderado",
      limiarBrilho: [20, 50],
      limiarContraste: 30,
      simetriaEsperada: false,
    },
    {
      nome: "Cardiomegalia",
      descricao: "Aumento da silhueta cardiaca (heurística de demonstração)",
      categoria: "cardiomegalia",
      gravidade: "moderado",
      limiarBrilho: [40, 70],
      limiarContraste: 35,
      simetriaEsperada: true,
    },
    {
      nome: "Pneumotorax",
      descricao: "Ar no espaco pleural (heurística de demonstração)",
      categoria: "pneumotorax",
      gravidade: "severo",
      limiarBrilho: [60, 90],
      limiarContraste: 50,
      simetriaEsperada: false,
    },
    {
      nome: "Fratura",
      descricao: "Solucao de continuidade ossea (heurística de demonstração)",
      categoria: "fratura",
      gravidade: "moderado",
      limiarBrilho: [50, 85],
      limiarContraste: 60,
      simetriaEsperada: false,
    },
    {
      nome: "Exame Normal",
      descricao: "Sem alteracoes significativas detectadas (heurística de demonstração)",
      categoria: "normal",
      gravidade: "leve",
      limiarBrilho: [40, 70],
      limiarContraste: 40,
      simetriaEsperada: true,
    },
  ],
};

const DIAGNOSTICOS_GENERICOS: Array<{
  nome: string;
  descricao: string;
  categoria: AchadoCategoria;
  gravidade: "leve" | "moderado" | "severo";
}> = [
  {
    nome: "Alteracao de Textura",
    descricao: "Anomalia na textura a necessitar correlacao clinica (heurística de demonstração)",
    categoria: "anomalia_textura",
    gravidade: "leve",
  },
  {
    nome: "Padrao Normal",
    descricao: "Padrao de imagem dentro dos parametros esperados (heurística de demonstração)",
    categoria: "normal",
    gravidade: "leve",
  },
];

function extrairMetadadosLocal(img: HTMLImageElement): MetadadosCalculados {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const { data, width, height } = imageData;
  const total = width * height;

  let somaBrilho = 0;
  for (let i = 0; i < data.length; i += 4) {
    somaBrilho += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  const brilhoMedioFl = somaBrilho / total;
  const brilhoMedio = Math.round((brilhoMedioFl / 255) * 100);

  let somaDiff = 0;
  for (let i = 0; i < data.length; i += 4) {
    const b = (data[i] + data[i + 1] + data[i + 2]) / 3;
    somaDiff += (b - brilhoMedioFl) ** 2;
  }
  const desvio = Math.sqrt(somaDiff / total);
  const contraste = Math.round(Math.min((desvio / 128) * 100, 100));

  let somaNitidez = 0;
  let countNitidez = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const laplacian = Math.abs(
        data[idx] * 4 - data[idx - width * 4] - data[idx + width * 4] - data[idx - 4] - data[idx + 4]
      );
      somaNitidez += laplacian / 255;
      countNitidez++;
    }
  }
  const nitidez = countNitidez ? Math.round(Math.min((somaNitidez / countNitidez) * 100, 100)) : 0;

  const histograma = new Array(16).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const b = (data[i] + data[i + 1] + data[i + 2]) / 3;
    histograma[Math.min(Math.floor(b / 16), 15)]++;
  }

  return {
    brilhoMedio,
    nitidez,
    contraste,
    histograma: histograma.map((v) => Math.round((v / total) * 10000) / 100),
    razaoAspecto: Math.round((width / height) * 100) / 100,
  };
}

function analisarSimetriaLocal(img: HTMLImageElement): number {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, img.width, img.height);
  const largura = img.width;
  const altura = img.height;
  const metade = Math.floor(largura / 2);
  let diff = 0;
  let count = 0;
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < metade; x++) {
      const e = (y * largura + x) * 4;
      const d = (y * largura + (largura - 1 - x)) * 4;
      const be = (data[e] + data[e + 1] + data[e + 2]) / 3;
      const bd = (data[d] + data[d + 1] + data[d + 2]) / 3;
      diff += Math.abs(be - bd);
      count++;
    }
  }
  const media = count ? diff / count / 255 : 0;
  return Math.round(Math.max(0, 100 - media * 100));
}

function detectarAnomaliasTexturaLocal(img: HTMLImageElement): Array<{ x: number; y: number; intensidade: number }> {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height);
  const grid = Math.max(4, Math.floor(Math.min(width, height) / 50));
  const rw = Math.floor(width / grid);
  const rh = Math.floor(height / grid);
  const medias: number[][] = [];
  for (let gy = 0; gy < grid; gy++) {
    medias[gy] = [];
    for (let gx = 0; gx < grid; gx++) {
      let soma = 0;
      let cnt = 0;
      for (let y = gy * rh; y < (gy + 1) * rh && y < height; y++) {
        for (let x = gx * rw; x < (gx + 1) * rw && x < width; x++) {
          const idx = (y * width + x) * 4;
          soma += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          cnt++;
        }
      }
      medias[gy][gx] = cnt ? soma / cnt : 128;
    }
  }
  const anomalias: Array<{ x: number; y: number; intensidade: number }> = [];
  for (let gy = 1; gy < grid - 1; gy++) {
    for (let gx = 1; gx < grid - 1; gx++) {
      const mediaViz =
        (medias[gy - 1][gx] + medias[gy + 1][gx] + medias[gy][gx - 1] + medias[gy][gx + 1]) / 4;
      const desvio = Math.abs(medias[gy][gx] - mediaViz);
      if (desvio > 20) {
        anomalias.push({
          x: (gx * rw + rw / 2) / width,
          y: (gy * rh + rh / 2) / height,
          intensidade: Math.round(Math.min(desvio / 1.28, 100)),
        });
      }
    }
  }
  return anomalias;
}

function obterModalidadePeloNome(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes("raio") || n.includes("rx") || n.includes("x-ray")) return "Raio-X";
  if (n.includes("tomografia") || n.includes("tc") || n.includes("ct")) return "Tomografia Computorizada";
  if (n.includes("ressonancia") || n.includes("rm") || n.includes("mri")) return "Ressonancia Magnetica";
  if (n.includes("ecografia") || n.includes("eco") || n.includes("ultras")) return "Ecografia";
  if (n.includes("mamografia") || n.includes("mamo")) return "Mamografia";
  return "Raio-X";
}

function converterParaApiUrl(url: string): string {
  if (url.startsWith("/uploads/")) return `/api${url}`;
  return url;
}

function carregarImagem(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      const img2 = new Image();
      img2.onload = () => resolve(img2);
      img2.onerror = () => reject(new Error(`Falha ao carregar imagem: ${url}`));
      img2.src = url;
    };
    img.src = converterParaApiUrl(url);
  });
}

function gerarDiagnosticoFallback(
  imagemId: number,
  modalidade: string,
  metadados: MetadadosCalculados,
  anomalias: Array<{ x: number; y: number; intensidade: number }>,
  simetria: number,
): MLDiagnostico {
  const possiveis = DIAGNOSTICOS_POR_MODALIDADE[modalidade] || DIAGNOSTICOS_GENERICOS;
  const achados: MLAchado[] = [];
  const regioesInteresse: MLRegiao[] = [];
  let diagnosticoPrincipal: string | null = null;
  let confiancaDiagnostico = 0;
  const recomendacoes: string[] = [];

  for (const diag of possiveis) {
    let score = 50;
    const [min, max] = diag.limiarBrilho;
    if (metadados.brilhoMedio >= min && metadados.brilhoMedio <= max) score += 10;
    if (metadados.contraste >= diag.limiarContraste) score += 10;
    if (diag.simetriaEsperada && simetria > 70) score += 15;
    else if (!diag.simetriaEsperada && simetria < 70) score += 15;
    if (anomalias.length > 0 && diag.categoria !== "normal") score += Math.min(anomalias.length * 5, 20);
    else if (anomalias.length === 0 && diag.categoria === "normal") score += 20;

    const confianca = Math.min(score, 98);
    if (confianca > 20) {
      achados.push({
        tipo: diag.nome,
        descricao: diag.descricao,
        gravidade: diag.gravidade,
        confianca,
        categoria: diag.categoria,
        localizacao: anomalias.length > 0
          ? `Regiao com anomalia (centro: ${(anomalias[0].x * 100).toFixed(0)}%, ${(anomalias[0].y * 100).toFixed(0)}%)`
          : "Difuso / Geral",
      });
    }
    if (confianca > confiancaDiagnostico && diag.categoria !== "normal") {
      confiancaDiagnostico = confianca;
      diagnosticoPrincipal = diag.nome;
    }
  }

  for (const a of anomalias) {
    regioesInteresse.push({
      x: a.x,
      y: a.y,
      largura: 0.1,
      altura: 0.1,
      tipo: "anomalia_textura",
      confianca: Math.min(a.intensidade, 95),
    });
  }

  if (achados.some((a) => a.gravidade === "severo")) {
    recomendacoes.push("Reavaliacao clinica urgente recomendada");
  }
  if (achados.some((a) => a.gravidade === "moderado")) {
    recomendacoes.push("Avaliacao por medico especialista recomendada");
  }
  if (achados.every((a) => a.categoria === "normal")) {
    recomendacoes.push("Exame dentro dos parametros de normalidade");
  }
  recomendacoes.push(
    "⚠️ Análise LOCAL de demonstração (heurística de brilho/contraste). NÃO é um modelo médico validado. O diagnóstico definitivo deve ser feito por médico especialista."
  );

  const principal = achados.find((a) => a.confianca > 60);
  const resumo = principal
    ? `${principal.tipo} (confianca: ${principal.confianca}%) - ${principal.descricao}.${achados.length > 1 ? ` Mais ${achados.length - 1} achado(s).` : ""}`
    : "Nenhuma alteracao significativa detectada automaticamente.";

  return {
    imagemId,
    modalidade,
    resumo,
    achados,
    diagnosticoPrincipal,
    confiancaDiagnostico,
    recomendacoes,
    metadados: {
      dimensoes: { largura: 0, altura: 0 },
      brilhoMedio: metadados.brilhoMedio,
      nitidez: metadados.nitidez,
      contraste: metadados.contraste,
      histograma: metadados.histograma,
      razaoAspecto: metadados.razaoAspecto,
    },
    regioesInteresse,
    processadoEm: new Date().toISOString(),
  };
}

// =========================================================================
// Chamada ao backend real (TorchXRayVision)
// =========================================================================
async function chamarBackendIA(
  imagemId: number,
  imageUrl: string,
  nomeTipoExame?: string,
): Promise<MLDiagnostico | null> {
  try {
    const img = await carregarImagem(imageUrl);
    const blob = await fetch(img.src).then((r) => r.blob());
    const modalidade = obterModalidadePeloNome(nomeTipoExame || "");

    const form = new FormData();
    form.append("file", blob, "imagem.png");
    form.append("modalidade", modalidade);

    const res = await fetch("/api/ia/analisar", {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      // Backend não disponível -> usa fallback
      console.warn("Backend de IA indisponível, a usar análise local:", res.status);
      return null;
    }

    const dados = await res.json();
    return {
      ...dados,
      imagemId,
      modalidade: dados.modalidade || modalidade,
      achados: dados.achados ?? [],
      recomendacoes: dados.recomendacoes ?? [],
      metadados: dados.metadados ?? { dimensoes: { largura: 0, altura: 0 }, brilhoMedio: 0, nitidez: 0, contraste: 0, histograma: [], razaoAspecto: 0 },
      regioesInteresse: dados.regioesInteresse ?? [],
    } as MLDiagnostico;
  } catch (err) {
    console.warn("Falha ao chamar backend de IA, a usar análise local:", err);
    return null;
  }
}

// =========================================================================
// API pública
// =========================================================================
export async function diagnosticarImagem(
  imagemId: number,
  imageUrl: string,
  nomeTipoExame?: string,
): Promise<MLDiagnostico> {
  // 1) Tenta o backend real primeiro
  const backendResult = await chamarBackendIA(imagemId, imageUrl, nomeTipoExame);
  if (backendResult) {
    return backendResult;
  }

  // 2) Fallback local (heurística)
  const img = await carregarImagem(imageUrl);
  const metadados = extrairMetadadosLocal(img);
  const modalidade = obterModalidadePeloNome(nomeTipoExame || "");
  const simetria = analisarSimetriaLocal(img);
  const anomalias = detectarAnomaliasTexturaLocal(img);

  return gerarDiagnosticoFallback(imagemId, modalidade, metadados, anomalias, simetria);
}

export async function diagnosticarMultiplasImagens(
  imagens: Array<{ id: number; path: string; tipoExameNome?: string }>
): Promise<MLDiagnostico[]> {
  const diagnosticos: MLDiagnostico[] = [];
  for (const img of imagens) {
    try {
      const resultado = await diagnosticarImagem(img.id, img.path, img.tipoExameNome);
      diagnosticos.push(resultado);
    } catch (err) {
      console.warn(`Erro ao diagnosticar imagem ${img.id}:`, err);
    }
  }
  return diagnosticos;
}

// =========================================================================
// Modo SERVIDOR (Node.js)
// =========================================================================
//
// As server actions de IA (ai.service.ts) executam em Node.js, onde as APIs
// de browser (canvas, Image, HTMLImageElement) NÃO existem. Para isso, este
// bloco fornece uma via server-safe:
//   1) Tenta chamar o backend de IA (TorchXRayVision) diretamente com os
//      bytes da imagem (sem depender de browser).
//   2) Se indisponível, usa um fallback heurístico determinístico baseado
//      nas estatísticas dos bytes da imagem.
// =========================================================================

function obterModalidadeServer(nome: string): string {
  return obterModalidadePeloNome(nome);
}

/**
 * Envia os bytes da imagem diretamente ao backend de IA (AI_BACKEND_URL),
 * sem passar por APIs de browser. Usa o endpoint FIFO que resolve para o
 * URL do backend (env AI_BACKEND_URL) ou o proxy local /api/ia/analisar.
 */
async function chamarBackendIAServer(
  imagemId: number,
  imagemBytes: Buffer,
  nomeTipoExame?: string
): Promise<MLDiagnostico | null> {
  const modalidade = obterModalidadeServer(nomeTipoExame || "");

  const form = new FormData();
  // Blob/FormData estão disponíveis no Node 18+ (global).
  form.append("file", new Blob([new Uint8Array(imagemBytes)]), "imagem.png");
  form.append("modalidade", modalidade);

const aiBackendUrl = process.env.AI_BACKEND_URL?.replace(/\/$/, "");
  const aiBackendToken = process.env.AI_BACKEND_TOKEN?.trim();
  const url = aiBackendUrl ? `${aiBackendUrl}/api/analisar` : "/api/ia/analisar";

  try {
    const headers: Record<string, string> = {};
    // Se houver token configurado e estivermos a chamar o backend diretamente,
    // envia-o como Bearer. (Quando via proxy, o próprio proxy injeta o token.)
    if (aiBackendUrl && aiBackendToken) {
      headers["Authorization"] = `Bearer ${aiBackendToken}`;
    }

    const res = await fetch(url, {
      method: "POST",
      body: form,
      headers,
      // Não definir Content-Type: o fetch define o boundary multipart.
      ...(aiBackendUrl ? {} : { next: { revalidate: 0 } }),
    } as RequestInit);

    if (!res.ok) {
      console.warn("Backend de IA indisponível (server), a usar fallback:", res.status);
      return null;
    }

    const dados = await res.json();
    return {
      ...dados,
      imagemId,
      modalidade: dados.modalidade || modalidade,
      achados: dados.achados ?? [],
      recomendacoes: dados.recomendacoes ?? [],
      metadados:
        dados.metadados ?? {
          dimensoes: { largura: 0, altura: 0 },
          brilhoMedio: 0,
          nitidez: 0,
          contraste: 0,
          histograma: [],
          razaoAspecto: 0,
        },
      regioesInteresse: dados.regioesInteresse ?? [],
    } as MLDiagnostico;
  } catch (err) {
    console.warn("Falha ao chamar backend de IA (server), a usar fallback:", err);
    return null;
  }
}

/**
 * Analisa estatísticas básicas dos bytes crus da imagem (brilho/contraste)
 * de forma determinística para gerar um fallback sem depender de browser.
 * NÃO é um modelo médico validado — apenas sugestão de apoio.
 */
function calcularEstatisticasServer(imagemBytes: Buffer): {
  brilhoMedio: number;
  contraste: number;
} {
  const bytes = new Uint8Array(imagemBytes);
  if (bytes.length === 0) return { brilhoMedio: 50, contraste: 50 };

  // Amostra um subconjunto dos bytes para performance.
  const passo = Math.max(1, Math.floor(bytes.length / 200_000));
  let soma = 0;
  let somaQuad = 0;
  let conta = 0;
  for (let i = 0; i < bytes.length; i += passo) {
    const v = bytes[i];
    soma += v;
    somaQuad += v * v;
    conta++;
  }
  const media = soma / (conta || 1);
  const variancia = somaQuad / (conta || 1) - media * media;
  const desvio = Math.sqrt(Math.max(variancia, 0));

  return {
    brilhoMedio: Math.round(Math.min(Math.max((media / 255) * 100, 0), 100)),
    contraste: Math.round(Math.min(Math.max((desvio / 128) * 100, 0), 100)),
  };
}

/**
 * Fallback heurístico server-safe. Gera um MLDiagnostico a partir das
 * estatísticas dos bytes da imagem (sem browser).
 */
function gerarDiagnosticoFallbackServer(
  imagemId: number,
  modalidade: string,
  brilhoMedio: number,
  contraste: number
): MLDiagnostico {
  const possiveis = DIAGNOSTICOS_POR_MODALIDADE[modalidade] || DIAGNOSTICOS_GENERICOS;
  const achados: MLAchado[] = [];
  const regioesInteresse: MLRegiao[] = [];
  let diagnosticoPrincipal: string | null = null;
  let confiancaDiagnostico = 0;
  const recomendacoes: string[] = [];

  for (const diag of possiveis) {
    let score = 50;
    const [min, max] = diag.limiarBrilho;
    if (brilhoMedio >= min && brilhoMedio <= max) score += 15;
    if (contraste >= diag.limiarContraste) score += 15;

    const confianca = Math.min(score, 98);
    if (confianca > 20) {
      achados.push({
        tipo: diag.nome,
        descricao: diag.descricao,
        gravidade: diag.gravidade,
        confianca,
        categoria: diag.categoria,
        localizacao: "Difuso / Geral",
      });
    }
    if (confianca > confiancaDiagnostico && diag.categoria !== "normal") {
      confiancaDiagnostico = confianca;
      diagnosticoPrincipal = diag.nome;
    }
  }

  if (achados.some((a) => a.gravidade === "severo")) {
    recomendacoes.push("Reavaliacao clinica urgente recomendada");
  }
  if (achados.some((a) => a.gravidade === "moderado")) {
    recomendacoes.push("Avaliacao por medico especialista recomendada");
  }
  if (achados.every((a) => a.categoria === "normal")) {
    recomendacoes.push("Exame dentro dos parametros de normalidade");
  }
  recomendacoes.push(
    "⚠️ Análise LOCAL de demonstração (heurística de brilho/contraste). NÃO é um modelo médico validado. O diagnóstico definitivo deve ser feito por médico especialista."
  );

  const principal = achados.find((a) => a.confianca > 60);
  const resumo = principal
    ? `${principal.tipo} (confianca: ${principal.confianca}%) - ${principal.descricao}.${achados.length > 1 ? ` Mais ${achados.length - 1} achado(s).` : ""}`
    : "Nenhuma alteracao significativa detectada automaticamente.";

  return {
    imagemId,
    modalidade,
    resumo,
    achados,
    diagnosticoPrincipal,
    confiancaDiagnostico,
    recomendacoes,
    metadados: {
      dimensoes: { largura: 0, altura: 0 },
      brilhoMedio,
      nitidez: 0,
      contraste,
      histograma: [],
      razaoAspecto: 0,
    },
    regioesInteresse,
    processadoEm: new Date().toISOString(),
  };
}

/**
 * API pública server-safe para diagnóstico de imagem a partir dos bytes.
 * Deve ser usada em server actions / Node.js (NÃO usa APIs de browser).
 */
export async function diagnosticarImagemServer(
  imagemId: number,
  imagemBytes: Buffer,
  nomeTipoExame?: string
): Promise<MLDiagnostico> {
  // 1) Tenta o backend real primeiro (envio direto dos bytes).
  const backendResult = await chamarBackendIAServer(imagemId, imagemBytes, nomeTipoExame);
  if (backendResult) {
    return backendResult;
  }

  // 2) Fallback server-safe (heurística de bytes).
  const { brilhoMedio, contraste } = calcularEstatisticasServer(imagemBytes);
  const modalidade = obterModalidadeServer(nomeTipoExame || "");

  return gerarDiagnosticoFallbackServer(imagemId, modalidade, brilhoMedio, contraste);
}
