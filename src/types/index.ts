export interface PacienteType {
  id: number;
  numeroProcesso: string;
  nome: string;
  dataNascimento: Date | null;
  sexo: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  documento: string | null;
  nif: string | null;
  bi: string | null;
  foto: string | null;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
  exames?: ExameType[];
}

export interface ExameType {
  id: number;
  codigo: string | null;
  pacienteId: number;
  tipoExameId: number;
  tecnicoId: number | null;
  procedenciaId: number | null;
  medicoSolicitante: string | null;
  observacao: string | null;
  estado: string;
  dataExame: Date;
  createdAt: Date;
  updatedAt: Date;
  realizadoPorId: number | null;
  paciente?: PacienteType;
  tipoExame?: TipoExameType;
  tecnico?: TecnicoType;
  procedencia?: ProcedenciaType;
  realizadoPor?: UtilizadorType;
  imagens?: ImagemType[];
}

export interface TecnicoType {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  especialidade: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
  exames?: ExameType[];
}

export interface ProcedenciaType {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
  exames?: ExameType[];
}

export interface TipoExameType {
  id: number;
  nome: string;
  modalidade: string | null;
  descricao: string | null;
  duracaoMin: number | null;
  preco: number | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
  exames?: ExameType[];
}

export interface ImagemType {
  id: number;
  exameId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  tamanho: number;
  path: string;
  createdAt: Date;
  exame?: ExameType;
}

export type Role = "ADMIN" | "TECNICO" | "RECEPCAO";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  TECNICO: "Técnico",
  RECEPCAO: "Receção",
};

export interface UtilizadorType {
  id: number;
  nome: string;
  email: string;
  password: string;
  role: Role;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoricoType {
  id: number;
  acao: string;
  entidade: string;
  entidadeId: number | null;
  descricao: string | null;
  utilizadorId: number | null;
  pacienteId: number | null;
  exameId: number | null;
  createdAt: Date;
  utilizador?: UtilizadorType;
  paciente?: PacienteType;
  exame?: ExameType;
}

export interface TurnoType {
  id: number;
  tecnicoId: number;
  data: Date;
  horaInicio: string;
  horaFim: string;
  tipo: string;
  estado: string;
  observacao: string | null;
  createdById: number | null;
  createdAt: Date;
  updatedAt: Date;
  tecnico?: TecnicoType;
  createdBy?: UtilizadorType;
}

export interface ConversaParticipanteType {
  id: number;
  conversaId: number;
  utilizadorId: number;
  lidaEm: Date | null;
  createdAt: Date;
  utilizador?: UtilizadorType;
}

export interface ConversaType {
  id: number;
  titulo: string | null;
  criadaPorId: number | null;
  createdAt: Date;
  updatedAt: Date;
  criadaPor?: UtilizadorType | null;
  participantes?: ConversaParticipanteType[];
  mensagens?: MensagemType[];
  _count?: { mensagens: number };
}

export interface MensagemType {
  id: number;
  conversaId: number;
  utilizadorId: number;
  conteudo: string;
  createdAt: Date;
  utilizador?: UtilizadorType;
}

export type EstadosTurno = "Agendado" | "Em curso" | "Concluído" | "Cancelado";
export type TiposTurno = "Manhã" | "Tarde" | "Noite" | "Normal";

export const ESTADOS_TURNO: { value: EstadosTurno; label: string; color: string }[] = [
  { value: "Agendado", label: "Agendado", color: "bg-blue-100 text-blue-800" },
  { value: "Em curso", label: "Em Curso", color: "bg-yellow-100 text-yellow-800" },
  { value: "Concluído", label: "Concluído", color: "bg-green-100 text-green-800" },
  { value: "Cancelado", label: "Cancelado", color: "bg-red-100 text-red-800" },
];

export const TIPOS_TURNO: TiposTurno[] = ["Manhã", "Tarde", "Noite", "Normal"];

export type EstadosExame = "Pendente" | "Em andamento" | "Realizado" | "Entregue" | "Cancelado";

export const ESTADOS_EXAME: { value: EstadosExame; label: string; color: string }[] = [
  { value: "Pendente", label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  { value: "Em andamento", label: "Em Andamento", color: "bg-blue-100 text-blue-800" },
  { value: "Realizado", label: "Realizado", color: "bg-green-100 text-green-800" },
  { value: "Entregue", label: "Entregue", color: "bg-purple-100 text-purple-800" },
  { value: "Cancelado", label: "Cancelado", color: "bg-red-100 text-red-800" },
];

export const MODALIDADES = [
  "Ressonância Magnética",
  "Tomografia Computorizada",
  "Raio-X",
  "Ecografia",
  "Mamografia",
  "Densitometria Óssea",
  "Medicina Nuclear",
  "Angiografia",
  "Outro",
] as const;

