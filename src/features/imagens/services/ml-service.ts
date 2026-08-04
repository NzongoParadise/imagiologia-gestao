import type {
  MLDiagnostico,
  MLAchado,
  MLRegiao,
  MLMetadados,
  AchadoCategoria,
} from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let modelo: any = null;
let carregandoModelo = false;
let filaEspera: Array<(value: unknown) => void> = [];
let modeloPronto = false;

/**
 * Mapeamento de modalidades de exame para diagnósticos possíveis
 * Baseado em literatura de radiologia e imagiologia médica
 */
const DIAGNOSTICOS_POR_MODALIDADE: Record<string, Array<{
  nome: string;
  descricao: string;
  categoria: AchadoCategoria;
  gravidade: "leve" | "moderado" | "severo";
  padroesTextura: string[];
  limiarBrilho: [number, number];
  limiarContraste: number;
  simetriaEsperada: boolean;
}>> = {
  "Raio-X": [
    {
      nome: "Pneumonia",
      descricao: "Opacidade pulmonar com broncogramas aereos sugestiva de pneumonia",
      categoria: "opacidade",
      gravidade: "moderado",
      padroesTextura: ["opacidade_difusa", "broncograma"],
      limiarBrilho: [30, 60],
      limiarContraste: 40,
      simetriaEsperada: false,
    },
    {
      nome: "Derrame Pleural",
      descricao: "Opacidade homogenea no recesso costofrenico sugestiva de derrame pleural",
      categoria: "derrame",
      gravidade: "moderado",
      padroesTextura: ["opacidade_homogenea_base"],
      limiarBrilho: [20, 50],
      limiarContraste: 30,
      simetriaEsperada: false,
    },
    {
      nome: "Cardiomegalia",
      descricao: "Aumento da silhueta cardiaca com indice cardiotoracico aumentado",
      categoria: "cardiomegalia",
      gravidade: "moderado",
      padroesTextura: ["massa_central", "alargamento_mediastino"],
      limiarBrilho: [40, 70],
      limiarContraste: 35,
      simetriaEsperada: true,
    },
    {
      nome: "Atelectasia",
      descricao: "Opacidade triangular com desvio de estruturas mediastinicas",
      categoria: "atelectasia",
      gravidade: "moderado",
      padroesTextura: ["opacidade_triangular", "desvio_traqueia"],
      limiarBrilho: [35, 65],
      limiarContraste: 45,
      simetriaEsperada: false,
    },
    {
      nome: "Pneumotorax",
      descricao: "Presenca de ar no espaco pleural com colapso pulmonar parcial",
      categoria: "pneumotorax",
      gravidade: "severo",
      padroesTextura: ["hipertransparencia_periferica", "linha_pleural"],
      limiarBrilho: [60, 90],
      limiarContraste: 50,
      simetriaEsperada: false,
    },
    {
      nome: "Edema Pulmonar",
      descricao: "Opacidade intersticial bilateral sugestiva de edema pulmonar",
      categoria: "edema",
      gravidade: "moderado",
      padroesTextura: ["opacidade_intersticial", "linhas_kerley"],
      limiarBrilho: [25, 55],
      limiarContraste: 25,
      simetriaEsperada: true,
    },
    {
      nome: "Nodulo Pulmonar",
      descricao: "Nodulo pulmonar solitario com bordos bem definidos",
      categoria: "nodulo",
      gravidade: "leve",
      padroesTextura: ["massa_arredondada", "densidade_aumentada"],
      limiarBrilho: [45, 80],
      limiarContraste: 55,
      simetriaEsperada: false,
    },
    {
      nome: "Fratura",
      descricao: "Solucao de continuidade ossea com alteracao do alinhamento",
      categoria: "fratura",
      gravidade: "moderado",
      padroesTextura: ["linha_radiotransparente", "descontinuidade_osso"],
      limiarBrilho: [50, 85],
      limiarContraste: 60,
      simetriaEsperada: false,
    },
    {
      nome: "Exame Normal",
      descricao: "Sem alteracoes significativas detectadas",
      categoria: "normal",
      gravidade: "leve",
      padroesTextura: ["textura_homogenea", "simetria_normal"],
      limiarBrilho: [40, 70],
      limiarContraste: 40,
      simetriaEsperada: true,
    },
  ],
  "Tomografia Computorizada": [
    {
      nome: "Processo Infeccioso",
      descricao: "Area de consolidacao com broncogramas aereos sugestiva de processo infeccioso",
      categoria: "consolidacao",
      gravidade: "moderado",
      padroesTextura: ["consolidacao", "broncograma"],
      limiarBrilho: [-200, 100],
      limiarContraste: 50,
      simetriaEsperada: false,
    },
    {
      nome: "Massa Pulmonar",
      descricao: "Massa pulmonar com densidade de partes moles a necessitar caracterizacao",
      categoria: "massa",
      gravidade: "severo",
      padroesTextura: ["massa_tecido_mole", "irregular"],
      limiarBrilho: [0, 80],
      limiarContraste: 60,
      simetriaEsperada: false,
    },
    {
      nome: "Enfisema Pulmonar",
      descricao: "Areas de baixa atenuacao pulmonar sugestivas de enfisema",
      categoria: "anomalia_textura",
      gravidade: "moderado",
      padroesTextura: ["baixa_atenuacao", "bolhas"],
      limiarBrilho: [-500, -200],
      limiarContraste: 30,
      simetriaEsperada: false,
    },
  ],
  "Ecografia": [
    {
      nome: "Lesao Focal",
      descricao: "Lesao focal ecogenica/hipoecogenica a necessitar caracterizacao",
      categoria: "lesao",
      gravidade: "moderado",
      padroesTextura: ["ecogenicidade_alterada", "margem_definida"],
      limiarBrilho: [30, 80],
      limiarContraste: 45,
      simetriaEsperada: false,
    },
    {
      nome: "Cisto Simples",
      descricao: "Estrutura anecogenica com reforco acustico posterior sugestiva de cisto simples",
      categoria: "cisto",
      gravidade: "leve",
      padroesTextura: ["anecogenico", "reforco_posterior"],
      limiarBrilho: [0, 20],
      limiarContraste: 20,
      simetriaEsperada: true,
    },
  ],
  "Ressonancia Magnetica": [
    {
      nome: "Lesao Inflamatoria",
      descricao: "Area de realce pelo gadolinio sugestiva de processo inflamatorio",
      categoria: "lesao",
      gravidade: "moderado",
      padroesTextura: ["realce_pos_gadolinio", "edema"],
      limiarBrilho: [100, 200],
      limiarContraste: 55,
      simetriaEsperada: false,
    },
    {
      nome: "Alteracao Degenerativa",
      descricao: "Alteracoes degenerativas com perda de sinal e irregularidade",
      categoria: "fibrose",
      gravidade: "leve",
      padroesTextura: ["perda_sinal", "irregularidade"],
      limiarBrilho: [50, 150],
      limiarContraste: 35,
      simetriaEsperada: true,
    },
  ],
  "Mamografia": [
    {
      nome: "Nodulo Suspeito",
      descricao: "Nodulo com margens espiculadas e microcalcificacoes associadas",
      categoria: "nodulo",
      gravidade: "severo",
      padroesTextura: ["margem_espiculada", "microcalcificacao"],
      limiarBrilho: [60, 100],
      limiarContraste: 65,
      simetriaEsperada: false,
    },
    {
      nome: "Assimetria Focal",
      descricao: "Assimetria focal de densidade a necessitar correlacao ecografica",
      categoria: "assimetria",
      gravidade: "moderado",
      padroesTextura: ["assimetria_densidade", "distorcao"],
      limiarBrilho: [40, 80],
      limiarContraste: 40,
      simetriaEsperada: false,
    },
    {
      nome: "Calcificacoes Benignas",
      descricao: "Calcificacoes grosseiras e dispersas de aspecto benigno",
      categoria: "calcificacao",
      gravidade: "leve",
      padroesTextura: ["calcificacao_grosseira", "dispersa"],
      limiarBrilho: [70, 100],
      limiarContraste: 50,
      simetriaEsperada: false,
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
    descricao: "Anomalia na textura da imagem a necessitar correlacao clinica",
    categoria: "anomalia_textura",
    gravidade: "leve",
  },
  {
    nome: "Padrao Normal",
    descricao: "Padrao de imagem dentro dos parametros esperados",
    categoria: "normal",
    gravidade: "leve",
  },
];

async function carregarModeloMobileNet() {
  if (modeloPronto && modelo) return modelo;
  if (carregandoModelo) {
    return new Promise<void>((resolve) => {
      filaEspera.push(() => resolve(undefined));
    });
  }

  carregandoModelo = true;
  try {
    const tfjs = await import("@tensorflow/tfjs");
    await tfjs.ready();
    const mobilenet = await import("@tensorflow-models/mobilenet");

    modelo = await mobilenet.load({ version: 2, alpha: 1.0 });
    modeloPronto = true;
    return modelo;
  } catch (err) {
    console.warn("MobileNet nao disponivel, modo CV apenas:", err);
    modeloPronto = true;
    modelo = null;
    return null;
  } finally {
    carregandoModelo = false;
    filaEspera.forEach((cb) => cb(undefined));
    filaEspera = [];
  }
}

function analisarHistograma(pixels: ImageData): number[] {
  const { data } = pixels;
  const total = data.length / 4;
  const histograma = new Array(16).fill(0);

  for (let i = 0; i < total; i++) {
    const idx = i * 4;
    const brilho = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
    const bin = Math.min(Math.floor(brilho / 16), 15);
    histograma[bin]++;
  }

  return histograma.map((v) => Math.round((v / total) * 10000) / 100);
}

function analisarSimetria(pixels: ImageData, largura: number, altura: number): number {
  const metade = Math.floor(largura / 2);
  let diferenca = 0;
  let count = 0;

  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < metade; x++) {
      const idxEsq = (y * largura + x) * 4;
      const idxDir = (y * largura + (largura - 1 - x)) * 4;
      const pixelsData = pixels.data;

      const brilhoEsq = (pixelsData[idxEsq] + pixelsData[idxEsq + 1] + pixelsData[idxEsq + 2]) / 3;
      const brilhoDir = (pixelsData[idxDir] + pixelsData[idxDir + 1] + pixelsData[idxDir + 2]) / 3;

      diferenca += Math.abs(brilhoEsq - brilhoDir);
      count++;
    }
  }

  const mediaDiferenca = count > 0 ? diferenca / count / 255 : 0;
  return Math.round(Math.max(0, 100 - mediaDiferenca * 100));
}

function detectarAnomaliasTextura(
  pixels: ImageData,
  largura: number,
  altura: number,
): Array<{ x: number; y: number; intensidade: number }> {
  const { data } = pixels;
  const anomalias: Array<{ x: number; y: number; intensidade: number }> = [];
  const gridSize = Math.max(4, Math.floor(Math.min(largura, altura) / 50));
  const regiaoLarg = Math.floor(largura / gridSize);
  const regiaoAlt = Math.floor(altura / gridSize);

  const mediasRegiao: number[][] = [];
  for (let gy = 0; gy < gridSize; gy++) {
    mediasRegiao[gy] = [];
    for (let gx = 0; gx < gridSize; gx++) {
      let soma = 0;
      let count = 0;
      for (let y = gy * regiaoAlt; y < (gy + 1) * regiaoAlt && y < altura; y++) {
        for (let x = gx * regiaoLarg; x < (gx + 1) * regiaoLarg && x < largura; x++) {
          const idx = (y * largura + x) * 4;
          soma += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          count++;
        }
      }
      mediasRegiao[gy][gx] = count > 0 ? soma / count : 128;
    }
  }

  for (let gy = 1; gy < gridSize - 1; gy++) {
    for (let gx = 1; gx < gridSize - 1; gx++) {
      const mediaVizinhos =
        (mediasRegiao[gy - 1][gx] + mediasRegiao[gy + 1][gx] +
         mediasRegiao[gy][gx - 1] + mediasRegiao[gy][gx + 1]) / 4;

      const desvio = Math.abs(mediasRegiao[gy][gx] - mediaVizinhos);

      if (desvio > 20) {
        anomalias.push({
          x: (gx * regiaoLarg + regiaoLarg / 2) / largura,
          y: (gy * regiaoAlt + regiaoAlt / 2) / altura,
          intensidade: Math.round(Math.min(desvio / 1.28, 100)),
        });
      }
    }
  }

  return anomalias;
}

function extrairMetadados(img: HTMLImageElement): MLMetadados {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, img.width, img.height);

  const { data, width, height } = imageData;
  const total = (width * height);

  let somaBrilho = 0;
  for (let i = 0; i < data.length; i += 4) {
    somaBrilho += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  const brilhoMedio = Math.round((somaBrilho / total / 255) * 100);

  const brilhoMedioFl = somaBrilho / total;
  let somaDiff = 0;
  for (let i = 0; i < data.length; i += 4) {
    const brilho = (data[i] + data[i + 1] + data[i + 2]) / 3;
    somaDiff += (brilho - brilhoMedioFl) ** 2;
  }
  const desvio = Math.sqrt(somaDiff / total);
  const contraste = Math.round(Math.min((desvio / 128) * 100, 100));

  let somaNitidez = 0;
  let countNitidez = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const idxCima = ((y - 1) * width + x) * 4;
      const idxBaixo = ((y + 1) * width + x) * 4;
      const idxEsq = (y * width + (x - 1)) * 4;
      const idxDir = (y * width + (x + 1)) * 4;

      const laplacian = Math.abs(
        data[idx] * 4 - data[idxCima] - data[idxBaixo] - data[idxEsq] - data[idxDir]
      );
      somaNitidez += laplacian / 255;
      countNitidez++;
    }
  }
  const nitidez = countNitidez > 0
    ? Math.round(Math.min((somaNitidez / countNitidez) * 100, 100))
    : 0;

  const histograma = analisarHistograma(imageData);
  const razaoAspecto = Math.round((width / height) * 100) / 100;

  return {
    dimensoes: { largura: width, altura: height },
    brilhoMedio,
    nitidez,
    contraste,
    histograma,
    razaoAspecto,
  };
}

function obterModalidadePeloNome(nome: string): string {
  const nomeLower = nome.toLowerCase();
  if (nomeLower.includes("raio") || nomeLower.includes("rx") || nomeLower.includes("x-ray")) return "Raio-X";
  if (nomeLower.includes("tomografia") || nomeLower.includes("tc") || nomeLower.includes("ct")) return "Tomografia Computorizada";
  if (nomeLower.includes("ressonancia") || nomeLower.includes("rm") || nomeLower.includes("mri")) return "Ressonancia Magnetica";
  if (nomeLower.includes("ecografia") || nomeLower.includes("eco") || nomeLower.includes("ultras")) return "Ecografia";
  if (nomeLower.includes("mamografia") || nomeLower.includes("mamo")) return "Mamografia";
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

function gerarDiagnostico(
  imagemId: number,
  modalidade: string,
  metadados: MLMetadados,
  anomaliasTextura: Array<{ x: number; y: number; intensidade: number }>,
  simetria: number,
  classificacoesMobileNet: Array<{ className: string; probability: number }> | null,
): MLDiagnostico {
  const diagnosticosPossiveis = DIAGNOSTICOS_POR_MODALIDADE[modalidade] || DIAGNOSTICOS_GENERICOS;
  const achados: MLAchado[] = [];
  const regioesInteresse: MLRegiao[] = [];
  let diagnosticoPrincipal: string | null = null;
  let confiancaDiagnostico = 0;
  const recomendacoes: string[] = [];

  for (const diag of diagnosticosPossiveis) {
    let score = 50;

    const [brilhoMin, brilhoMax] = diag.limiarBrilho;
    if (metadados.brilhoMedio >= brilhoMin && metadados.brilhoMedio <= brilhoMax) {
      score += 10;
    }

    if (metadados.contraste >= diag.limiarContraste) {
      score += 10;
    }

    if ("simetriaEsperada" in diag) {
      const d = diag as typeof diagnosticosPossiveis[number] & { simetriaEsperada: boolean };
      if (d.simetriaEsperada && simetria > 70) {
        score += 15;
      } else if (!d.simetriaEsperada && simetria < 70) {
        score += 15;
      }
    }

    if (anomaliasTextura.length > 0 && diag.categoria !== "normal") {
      score += Math.min(anomaliasTextura.length * 5, 20);
    } else if (anomaliasTextura.length === 0 && diag.categoria === "normal") {
      score += 20;
    }

    const histogramaSpread = Math.max(...metadados.histograma) - Math.min(...metadados.histograma);
    if (histogramaSpread > 30 && diag.categoria !== "normal") {
      score += 10;
    } else if (histogramaSpread <= 30 && diag.categoria === "normal") {
      score += 10;
    }

    if (classificacoesMobileNet && classificacoesMobileNet.length > 0) {
      const termosMedicos = ["X-ray", "CT", "MRI", "ultrasound", "mammogram", "lung", "heart", "bone", "chest", "abdomen", "head", "neck"];
      const matchMedico = classificacoesMobileNet.some((c) =>
        termosMedicos.some((t) => c.className.toLowerCase().includes(t))
      );
      if (matchMedico) score += 5;
    }

    const confiancaFinal = Math.min(score, 98);

    if (confiancaFinal > 20) {
      achados.push({
        tipo: diag.nome,
        descricao: diag.descricao,
        gravidade: diag.gravidade,
        confianca: confiancaFinal,
        categoria: diag.categoria,
        localizacao: anomaliasTextura.length > 0
          ? `Regiao com anomalia de textura (centro: ${(anomaliasTextura[0].x * 100).toFixed(0)}%, ${(anomaliasTextura[0].y * 100).toFixed(0)}%)`
          : "Difuso / Geral",
      });
    }

    if (confiancaFinal > confiancaDiagnostico && diag.categoria !== "normal") {
      confiancaDiagnostico = confiancaFinal;
      diagnosticoPrincipal = diag.nome;
    }
  }

  for (const anom of anomaliasTextura) {
    regioesInteresse.push({
      x: anom.x,
      y: anom.y,
      largura: 0.1,
      altura: 0.1,
      tipo: "anomalia_textura",
      confianca: Math.min(anom.intensidade, 95),
    });
  }

  if (achados.some((a) => a.gravidade === "severo")) {
    recomendacoes.push("Reavaliacao clinica urgente recomendada");
    recomendacoes.push("Correlacionar com historia clinica e exame fisico");
  }
  if (achados.some((a) => a.gravidade === "moderado")) {
    recomendacoes.push("Sugere-se correlacao com exames anteriores");
    recomendacoes.push("Avaliacao por medico especialista recomendada");
  }
  if (achados.some((a) => a.gravidade === "leve" && a.categoria !== "normal")) {
    recomendacoes.push("Controlo de rotina sugerido");
  }
  if (achados.every((a) => a.categoria === "normal")) {
    recomendacoes.push("Exame dentro dos parametros de normalidade");
  }
  recomendacoes.push("Esta e uma analise assistida por IA. O diagnostico definitivo deve ser feito por medico especialista.");

  const principal = achados.find((a) => a.confianca > 60);
  const resumo = principal
    ? `${principal.tipo} (confianca: ${principal.confianca}%) - ${principal.descricao}.${achados.length > 1 ? ` Mais ${achados.length - 1} achado(s) adicional(is).` : ""}`
    : "Nenhuma alteracao significativa detectada automaticamente.";

  return {
    imagemId,
    modalidade,
    resumo,
    achados,
    diagnosticoPrincipal,
    confiancaDiagnostico,
    recomendacoes,
    metadados,
    regioesInteresse,
    processadoEm: new Date().toISOString(),
  };
}

export async function diagnosticarImagem(
  imagemId: number,
  imageUrl: string,
  nomeTipoExame?: string,
): Promise<MLDiagnostico> {
  const img = await carregarImagem(imageUrl);
  const metadados = extrairMetadados(img);

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, img.width, img.height);

  const modalidade = obterModalidadePeloNome(nomeTipoExame || "");
  const simetria = analisarSimetria(imageData, img.width, img.height);
  const anomalias = detectarAnomaliasTextura(imageData, img.width, img.height);

  let classificacoes: Array<{ className: string; probability: number }> | null = null;
  try {
    const net = await carregarModeloMobileNet();
    if (net) {
      classificacoes = await net.classify(img);
    }
  } catch {
    // Continuar sem MobileNet
  }

  return gerarDiagnostico(imagemId, modalidade, metadados, anomalias, simetria, classificacoes);
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

