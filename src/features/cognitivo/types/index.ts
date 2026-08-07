// ---------------------------------------------------------------------------
// Tipos do Portal Médico Cognitivo
// ---------------------------------------------------------------------------

export type RegiaoGrupo =
  | "cabeca"
  | "torax"
  | "abdomen"
  | "pelve"
  | "coluna"
  | "membros";

export interface RegiaoAnatomica {
  id: number;
  nome: string;
  nomePT: string;
  grupo: RegiaoGrupo;
  ordem: number;
  riscoBase: number;
  descricao: string | null;
  icone: string | null;
  ativo: boolean;
  createdAt: string;
  exames?: ExameRegiao[];
  indicadores?: IndicadorRegiao[];
}

export interface ExameRegiao {
  id: number;
  exameId: number;
  regiaoId: number;
  createdAt: string;
  exame?: {
    id: number;
    codigo: string | null;
    estado: string;
    dataExame: string;
    tipoExame?: { nome: string; modalidade: string | null };
    laudos?: { assinado: boolean; conteudo: string }[];
  } | null;
}

export interface IndicadorRegiao {
  id: number;
  regiaoId: number;
  tipo: string;
  valor: number;
  nivel: "normal" | "alerta" | "critico";
  observacao: string | null;
  medidoEm: string;
  exameId: number | null;
}

export interface ComparacaoExame {
  id: number;
  exameBaseId: number;
  exameComparar: number;
  regiaoId: number | null;
  tipo: string;
  resultadoJson: Record<string, unknown>;
  conclusao: string | null;
  novasLesoes: number;
  regressao: number;
  progressao: number;
  estabilidade: number;
  criadoPorId: number | null;
  createdAt: string;
  exameBase?: { id: number; codigo: string | null; dataExame: string; tipoExame?: { nome: string } };
  exameVar?: { id: number; codigo: string | null; dataExame: string; tipoExame?: { nome: string } };
}

export interface CasoClinico {
  id: number;
  codigoAnonimo: string;
  diagnosticoPrincipal: string;
  modalidade: string | null;
  regiaoId: number | null;
  faixaEtaria: string | null;
  sexo: string | null;
  laudoResumo: string | null;
  tratamento: string | null;
  desfecho: string | null;
  tempoRecuperacaoDias: number | null;
  confirmado: boolean;
  descartado: boolean;
  origemExameId: number | null;
  createdAt: string;
}

export interface Contradicao {
  id: number;
  exameId: number;
  tipo: string;
  severidade: "baixa" | "media" | "alta" | "critica";
  descricao: string;
  detalheJson: Record<string, unknown> | null;
  estado: "aberta" | "confirmada" | "descartada" | "resolvida";
  criadoPorId: number | null;
  resolvidoPorId: number | null;
  resolvidoEm: string | null;
  createdAt: string;
  exame?: {
    id: number;
    codigo: string | null;
    estado: string;
    paciente?: { nome: string };
    tipoExame?: { nome: string };
  };
}

export interface SegundaOpiniao {
  id: number;
  exameId: number;
  solicitadoPorId: number | null;
  radiologistaId: number | null;
  motivo: string | null;
  estado: string;
  laudoOriginal: string | null;
  laudoSegunda: string | null;
  coerente: boolean | null;
  conclusao: string | null;
  solicitadoEm: string;
  concluidoEm: string | null;
  exame?: {
    id: number;
    codigo: string | null;
    paciente?: { nome: string };
    tipoExame?: { nome: string };
  };
  radiologista?: { id: number; nome: string } | null;
}

export interface ReuniaoClinica {
  id: number;
  titulo: string;
  pacienteId: number | null;
  descricao: string | null;
  estado: string;
  dataHora: string;
  ata: string | null;
  ataJson: Record<string, unknown> | null;
  criadoPorId: number | null;
  createdAt: string;
  updatedAt: string;
  paciente?: { id: number; nome: string } | null;
  criadoPor?: { id: number; nome: string } | null;
  participantes?: ReuniaoParticipante[];
  decisoes?: ReuniaoDecisao[];
  examesPartilhados?: ReuniaoExame[];
}

export interface ReuniaoParticipante {
  id: number;
  reuniaoId: number;
  utilizadorId: number;
  papel: string;
  confirmado: boolean;
  utilizador?: { id: number; nome: string; role: string };
}

export interface ReuniaoDecisao {
  id: number;
  reuniaoId: number;
  autorId: number | null;
  descricao: string;
  responsavel: number | null;
  prazo: string | null;
  estado: string;
  createdAt: string;
}

export interface ReuniaoExame {
  id: number;
  reuniaoId: number;
  exameId: number;
  exame?: {
    id: number;
    codigo: string | null;
    tipoExame?: { nome: string };
  };
}

export interface PredicaoServico {
  id: number;
  tipo: string;
  periodo: string;
  parametros: Record<string, unknown> | null;
  resultado: Record<string, unknown>;
  confianca: number;
  modelo: string;
  criadaPorId: number | null;
  criadoEm: string;
}

export interface SessaoIA {
  id: number;
  titulo: string;
  tipo: string;
  utilizadorId: number | null;
  contextoJson: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  mensagens?: MensagemIA[];
}

export interface MensagemIA {
  id: number;
  sessaoId: number;
  papel: "utilizador" | "assistente";
  conteudo: string;
  contextoJson: Record<string, unknown> | null;
  createdAt: string;
}

// Indicadores do Dashboard Cognitivo
export interface DashboardCognitivo {
  examesPendentes: number;
  examesConcluidos: number;
  examesUrgentes: number;
  pacientesCriticos: number;
  aguardandoLaudo: number;
  iaConcluida: number;
  inconsistencias: number;
  notificacoes: number;
  atividadesRecentes: {
    id: number;
    acao: string;
    descricao: string | null;
    createdAt: string;
    utilizador?: { nome: string } | null;
  }[];
  examesPorModalidade: { modalidade: string; total: number }[];
  examesPorMes: { mes: string; total: number }[];
  examesPorProcedencia: { procedencia: string; total: number }[];
  examesPorMedico: { medico: string; total: number }[];
  tempoMedioLaudo: number;
  evolucaoDemanda: { mes: string; total: number }[];
}

// Linha Temporal Clínica
export interface MarcoTemporal {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  data: string;
  exameId?: number | null;
  pacienteId?: number | null;
  dados?: Record<string, unknown>;
}

export interface LinhaTemporal {
  paciente: { id: number; nome: string; numeroProcesso: string } | null;
  marcos: MarcoTemporal[];
}

// Memória Clínica — pesquisa de casos semelhantes
export interface ResultadoMemoriaClinica {
  total: number;
  confirmados: number;
  descartados: number;
  casos: CasoClinico[];
  agrupamentoIdade: { label: string; total: number }[];
  agrupamentoSexo: { label: string; total: number }[];
  agrupamentoDesfecho: { label: string; total: number }[];
}

// Radar Epidemiológico
export interface DadoEpidemiologico {
  condicao: string;
  total: number;
  porSexo: { sexo: string; total: number }[];
  porFaixaEtaria: { label: string; total: number }[];
  porMes: { mes: string; total: number }[];
  porProcedencia: { procedencia: string; total: number }[];
}

// Previsão Inteligente
export interface ResultadoPrevisao {
  tipo: string;
  periodo: string;
  pontos: { label: string; valor: number; previsao?: boolean }[];
  confianca: number;
  resumo: string;
}

// IA Generativa — resposta com contexto
export interface RespostaIA {
  resposta: string;
  fontes: { tipo: string; descricao: string; id?: number }[];
  contextoJson: Record<string, unknown>;
}
