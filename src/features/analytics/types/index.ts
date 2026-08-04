export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  modalidade?: string;
  procedencia?: string;
  tecnicoId?: number;
  sexo?: string;
}

export interface DashboardMetrics {
  totalExames: number;
  totalPacientes: number;
  examesMesAtual: number;
  modalidadePrincipal: string;
  procedenciaPrincipal: string;
  sexoPredominante: { sexo: string; percentagem: number };
  pacientesAtendidos: number;
  pacientesUnicos: number;
}

export interface ExamesPorMes {
  mes: string;
  total: number;
  crescimento?: number;
}

export interface ExamesPorModalidade {
  modalidade: string;
  total: number;
  percentagem: number;
  cor: string;
}

export interface ExamesPorProcedencia {
  procedencia: string;
  total: number;
  percentagem: number;
}

export interface ExamesPorTecnico {
  tecnico: string;
  tecnicoId: number;
  total: number;
  percentagem: number;
}

export interface ExamesPorSexo {
  sexo: string;
  total: number;
  percentagem: number;
}

export interface ExamesPorFaixaEtaria {
  faixa: string;
  total: number;
  percentagem: number;
}

export interface RelatorioMensal {
  mes: string;
  ano: number;
  totalExames: number;
  totalPacientes: number;
  pacientesUnicos: number;
  distribuicaoModalidade: ExamesPorModalidade[];
  distribuicaoSexo: ExamesPorSexo[];
  procedencias: ExamesPorProcedencia[];
  tecnicos: ExamesPorTecnico[];
  faixaEtaria: ExamesPorFaixaEtaria[];
  examesPorDia: { dia: string; total: number }[];
}

export interface RelatorioAnual {
  ano: number;
  totalExames: number;
  totalPacientes: number;
  crescimentoMensal: ExamesPorMes[];
  comparacaoMeses: ExamesPorMes[];
  tendencias: { mes: string; media: number; tendencia: 'up' | 'down' | 'stable' }[];
  topModalidade: string;
  topProcedencia: string;
  topTecnico: string;
}

export const MODALIDADE_CORES = [
  '#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];

export const FAIXAS_ETARIAS = [
  { label: '0-12 anos', min: 0, max: 12 },
  { label: '13-25 anos', min: 13, max: 25 },
  { label: '26-45 anos', min: 26, max: 45 },
  { label: '46-65 anos', min: 46, max: 65 },
  { label: '66+ anos', min: 66, max: 200 },
];

