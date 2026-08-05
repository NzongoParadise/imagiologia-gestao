// Tipos do Portal do Médico

export interface MedicoSolicitacao {
  id: number;
  codigo: string | null;
  pacienteId: number;
  tipoExameId: number;
  medicoSolicitante: string | null;
  observacao: string | null;
  estado: string;
  prioridade: string;
  diagnosticoClinico: string | null;
  justificacaoClinica: string | null;
  dataExame: string;
  createdAt: string;
  updatedAt: string;
  solicitadoPorId: number | null;
  paciente?: {
    id: number;
    nome: string;
    numeroProcesso?: string;
  };
  tipoExame?: {
    id: number;
    nome: string;
    modalidade: string | null;
  };
  tecnico?: { id: number; nome: string } | null;
  procedencia?: { id: number; nome: string } | null;
  laudos?: {
    id: number;
    assinado: boolean;
    conteudo?: string;
    assinadoEm?: string | null;
    medicoAssinou?: { nome: string } | null;
  }[];
  imagens?: {
    id: number;
    exameId: number;
    filename: string;
    originalName: string;
    mimeType: string;
    tamanho: number;
    path: string;
    createdAt: string;
  }[];
  historico?: {
    id: number;
    acao: string;
    descricao: string | null;
    createdAt: string;
    utilizador?: { id: number; nome: string } | null;
  }[];
  _count?: { imagens: number };
}

export interface SolicitacaoLista {
  data: MedicoSolicitacao[];
  total: number;
  pages: number;
  currentPage: number;
}

export interface IndicadoresMedico {
  totalSolicitacoes: number;
  examesPendentes: number;
  examesConcluidos: number;
  examesUrgentes: number;
  pacientesAguardando: number;
  ultimasSolicitacoes: MedicoSolicitacao[];
  distribuicaoModalidades: { modalidade: string; count: number }[];
}

export interface MedicoLaudo {
  id: number;
  exameId: number;
  conteudo: string;
  medicoAssinouId: number | null;
  assinado: boolean;
  assinatura: string | null;
  assinadoEm: string | null;
  createdAt: string;
  updatedAt: string;
  exame?: {
    id: number;
    codigo: string | null;
    paciente: { id: number; nome: string; numeroProcesso: string };
    tipoExame: { nome: string; modalidade: string | null };
  };
  medicoAssinou?: { id: number; nome: string; email: string } | null;
}

export interface HistoricoPacienteMedico {
  id: number;
  numeroProcesso: string;
  nome: string;
  dataNascimento: string | null;
  sexo: string | null;
  telefone: string | null;
  email: string | null;
  exames: MedicoSolicitacao[];
}

export interface AgendaMedico {
  examesHoje: MedicoSolicitacao[];
  proximosExames: MedicoSolicitacao[];
  consultas: {
    id: number;
    tecnicoId: number;
    data: string;
    horaInicio: string;
    horaFim: string;
    tipo: string;
    estado: string;
    tecnico?: { id: number; nome: string; especialidade: string | null };
  }[];
}

export interface Radiologista {
  id: number;
  nome: string;
  email: string;
  role: string;
}

export interface DadosSolicitacao {
  pacientes: { id: number; nome: string; numeroProcesso: string }[];
  tiposExame: {
    id: number;
    nome: string;
    modalidade: string | null;
    duracaoMin: number | null;
  }[];
  radiologistas: Radiologista[];
}
