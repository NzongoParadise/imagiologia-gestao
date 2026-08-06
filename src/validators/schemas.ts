import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(4, "A password deve ter pelo menos 4 caracteres"),
});

export const pacienteSchema = z.object({
  numeroProcesso: z.string().min(1, "Número de processo é obrigatório"),
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  dataNascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  sexo: z.string().min(1, "Sexo é obrigatório"),
  telefone: z.string().nullable().optional(),
  email: z.string().email("Email inválido").nullable().optional().or(z.literal("")),
  endereco: z.string().min(1, "Endereço é obrigatório"),
  documento: z.string().nullable().optional(),
  nif: z.string().nullable().optional(),
  bi: z.string().nullable().optional(),
  foto: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
});

export const exameSchema = z.object({
  pacienteId: z.number({ message: "Paciente é obrigatório" }),
  tipoExameId: z.number({ message: "Tipo de Exame é obrigatório" }),
  tecnicoId: z.number().nullable().optional(),
  procedenciaId: z.number().nullable().optional(),
  medicoSolicitante: z.string().nullable().optional(),
  observacao: z.string().nullable().optional(),
  estado: z.string().default("Pendente"),
  dataExame: z.string().optional(),
});

export const tecnicoSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido").nullable().optional().or(z.literal("")),
  telefone: z.string().nullable().optional(),
  especialidade: z.string().nullable().optional(),
  ativo: z.boolean().default(true),
});

export const procedenciaSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  descricao: z.string().nullable().optional(),
  ativo: z.boolean().default(true),
});

export const tipoExameSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  modalidade: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
  duracaoMin: z.number().nullable().optional(),
  preco: z.number().nullable().optional(),
  ativo: z.boolean().default(true),
});

export const turnoSchema = z.object({
  tecnicoId: z.number({ message: "Técnico é obrigatório" }),
  data: z.string({ message: "Data é obrigatória" }),
  horaInicio: z.string({ message: "Hora de início é obrigatória" }),
  horaFim: z.string({ message: "Hora de fim é obrigatória" }),
  tipo: z.string().default("Normal"),
  estado: z.string().default("Agendado"),
  observacao: z.string().nullable().optional(),
});

export const solicitacaoExameSchema = z.object({
  pacienteId: z.number({ message: "Paciente é obrigatório" }),
  tipoExameId: z.number({ message: "Tipo de exame é obrigatório" }),
  diagnosticoClinico: z.string().min(3, "Diagnóstico clínico é obrigatório"),
  prioridade: z.string().default("Normal"),
  justificacaoClinica: z.string().min(3, "Justificação clínica é obrigatória"),
  observacoes: z.string().nullable().optional(),
  medicoSolicitante: z.string().nullable().optional(),
});

export const alterarPrioridadeSchema = z.object({
  prioridade: z.enum(["Normal", "Prioritário", "Urgente", "Emergência"]),
  justificacao: z.string().min(3, "Justificação é obrigatória"),
});

export const laudoSchema = z.object({
  exameId: z.number(),
  conteudo: z.string().min(10, "O conteúdo do laudo deve ter pelo menos 10 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type PacienteInput = z.infer<typeof pacienteSchema>;
export type ExameInput = z.infer<typeof exameSchema>;
export type TecnicoInput = z.infer<typeof tecnicoSchema>;
export type ProcedenciaInput = z.infer<typeof procedenciaSchema>;
export type TipoExameInput = z.infer<typeof tipoExameSchema>;
export type TurnoInput = z.infer<typeof turnoSchema>;
export type SolicitacaoExameInput = z.infer<typeof solicitacaoExameSchema>;
export type AlterarPrioridadeInput = z.infer<typeof alterarPrioridadeSchema>;
export type LaudoInput = z.infer<typeof laudoSchema>;

