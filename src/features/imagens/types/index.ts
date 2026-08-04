export interface MLDiagnostico {
  /** ID da imagem analisada */
  imagemId: number;
  /** Modalidade do exame (RX, TC, RM, ECO, MAMO) */
  modalidade: string;
  /** Resumo do diagnóstico */
  resumo: string;
  /** Achados/anomalias detectados */
  achados: MLAchado[];
  /** Diagnóstico principal sugerido */
  diagnosticoPrincipal: string | null;
  /** Confiança do diagnóstico principal (0-100) */
  confiancaDiagnostico: number;
  /** Recomendações */
  recomendacoes: string[];
  /** Metadados da imagem */
  metadados: MLMetadados;
  /** Marcadores de região na imagem (coordenadas normalizadas 0-1) */
  regioesInteresse: MLRegiao[];
  /** Timestamp */
  processadoEm: string;
}

export interface MLAchado {
  /** Tipo de achado */
  tipo: string;
  /** Descrição detalhada */
  descricao: string;
  /** Gravidade (leve, moderado, severo) */
  gravidade: "leve" | "moderado" | "severo";
  /** Confiança (0-100) */
  confianca: number;
  /** Categoria do achado */
  categoria: AchadoCategoria;
  /** Localização na imagem */
  localizacao?: string;
}

export type AchadoCategoria =
  | "nodulo"
  | "massa"
  | "calcificacao"
  | "opacidade"
  | "derrame"
  | "fratura"
  | "edema"
  | "atelectasia"
  | "cardiomegalia"
| "pneumotorax"
  | "consolidacao"
  | "fibrose"
  | "cisto"
  | "lesao"
  | "anomalia_textura"
  | "assimetria"
  | "normal";

export interface MLRegiao {
  /** x centro (0-1) */
  x: number;
  /** y centro (0-1) */
  y: number;
  /** largura (0-1) */
  largura: number;
  /** altura (0-1) */
  altura: number;
  /** tipo de achado na região */
  tipo: string;
  /** confiança (0-100) */
  confianca: number;
}

export interface MLMetadados {
  dimensoes: { largura: number; altura: number };
  brilhoMedio: number;
  nitidez: number;
  contraste: number;
  histograma: number[];
  razaoAspecto: number;
}

export interface MLAnaliseState {
  loading: boolean;
  error: string | null;
  diagnosticos: Record<number, MLDiagnostico>;
}

