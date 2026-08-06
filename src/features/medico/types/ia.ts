// ---------------------------------------------------------------------------
// Tipos para o módulo de Diagnóstico Assistido por IA (Portal do Médico)
// ---------------------------------------------------------------------------

export type StatusAnaliseIA = "processando" | "concluido" | "erro";

export interface AchadoIA {
  nome: string;
  probabilidade: number;
  presente: boolean;
  descricao?: string;
}

export interface DiagnosticoDiferencialItem {
  nome: string;
  confianca: number;
  descricao?: string;
}

export interface ResultadoAnaliseIA {
  diagnostico: string;
  confidence: number;
  findings: AchadoIA[];
  summary: string;
  model: string;
  differential?: DiagnosticoDiferencialItem[];
  heatmap?: string;
  preLaudo?: string;
}

export interface AnaliseIA {
  id: number;
  exameId: number;
  utilizadorId: number | null;
  imagemId: number | null;
  modelo: string;
  diagnosticoPrincipal: string | null;
  confianca: number;
  achados: AchadoIA[];
  resumo: string;
  resultadoJson: ResultadoAnaliseIA | Record<string, unknown>;
  heatmap: string | null;
  preLaudo: string | null;
  status: StatusAnaliseIA;
  tempoProcessamento: number;
  createdAt: string;
  updatedAt: string;
  utilizador?: { id: number; nome: string } | null;
}

export interface AnaliseIAInput {
  exameId: number;
  imagemId: number | null;
  resultado: ResultadoAnaliseIA;
  tempoProcessamento: number;
  status?: StatusAnaliseIA;
}

export interface DadosPreLaudoIA {
  diagnostico: string;
  achados: AchadoIA[];
  resumo: string;
}

export type EvolucaoExame = "Melhora" | "Piora" | "Sem alterações";
