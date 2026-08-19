import { Paciente } from "../../../domain/paciente";

export interface RegistarPacienteRequest {
  numeroProcesso?: string;
  nome: string;
  dataNascimento?: string | Date;
  sexo?: string;
  telefone?: string;
  email?: string;
  nif?: string;
  bi?: string;
  documento?: string;
  endereco?: string;
  foto?: string;
  observacoes?: string;
}

export interface AtualizarPacienteRequest {
  id: string | number;
  nome?: string;
  dataNascimento?: string | Date;
  sexo?: string;
  telefone?: string;
  email?: string;
  nif?: string;
  bi?: string;
  documento?: string;
  endereco?: string;
  foto?: string;
  observacoes?: string;
}

export interface PacienteResponse {
  id: string;
  numeroProcesso: string;
  nome: string;
  dataNascimento?: string;
  idade?: number | null;
  sexo?: string;
  telefone?: string;
  email?: string;
  nif?: string;
  bi?: string;
  documento?: string;
  endereco?: string;
  foto?: string;
  observacoes?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export function mapPacienteToResponse(paciente: Paciente): PacienteResponse {
  return {
    id: paciente.getId().value,
    numeroProcesso: paciente.getNumeroProcesso().value,
    nome: paciente.getNome(),
    dataNascimento: paciente.getDataNascimento()?.toISOString().split("T")[0],
    idade: paciente.calcularIdade(),
    sexo: paciente.getSexo(),
    telefone: paciente.getContacto().telefone,
    email: paciente.getContacto().email,
    nif: paciente.getDocumento().nif,
    bi: paciente.getDocumento().bi,
    documento: paciente.getDocumento().documentoOutro,
    endereco: paciente.getEndereco(),
    foto: paciente.getFoto(),
    observacoes: paciente.getObservacoes(),
    criadoEm: paciente.getCriadoEm().toISOString(),
    atualizadoEm: paciente.getAtualizadoEm().toISOString(),
  };
}
