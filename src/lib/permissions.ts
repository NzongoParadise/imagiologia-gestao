// ---------------------------------------------------------------------------
// Sistema de Permissões (RBAC)
// Módulo puro — seguro para importar em client e server components.
// ---------------------------------------------------------------------------

export type Role = "ADMIN" | "TECNICO" | "RECEPCAO" | "MEDICO";

export const ROLES: Role[] = ["ADMIN", "TECNICO", "RECEPCAO", "MEDICO"];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  TECNICO: "Técnico",
  RECEPCAO: "Receção",
  MEDICO: "Médico",
};

export type Modulo =
  | "dashboard"
  | "pacientes"
  | "agendamentos"
  | "turnos"
  | "exames"
  | "imagens"
  | "tecnicos"
  | "procedencias"
  | "tipos-exame"
  | "relatorios"
  | "utilizadores"
  | "configuracoes"
  | "historico"
  | "chat"
  | "medico"
  | "cognitivo"
  | "atendimento";

export type Acao = "ver" | "criar" | "editar" | "eliminar";

export type PermissaoString = string; // ex: "exames.criar"

/**
 * Matriz de permissões por role.
 * - "ADMIN" possui acesso total ("*.*").
 * - "TECNICO" tem acesso de gestão às áreas técnicas e clínicas.
 * - "RECEPCAO" tem acesso de front-office (pacientes, agendamentos, exames).
 * - "MEDICO" tem acesso ao portal médico e cognitivo.
 */
const PERMISSOES: Record<Role, PermissaoString[]> = {
  ADMIN: ["*.*"],

  TECNICO: [
    "dashboard.ver",
    // Pacientes
    "pacientes.ver",
    "pacientes.criar",
    "pacientes.editar",
    "pacientes.eliminar",
    // Agendamentos
    "agendamentos.ver",
    "agendamentos.criar",
    "agendamentos.editar",
    "agendamentos.eliminar",
    // Turnos
    "turnos.ver",
    "turnos.criar",
    "turnos.editar",
    "turnos.eliminar",
    // Exames
    "exames.ver",
    "exames.criar",
    "exames.editar",
    "exames.eliminar",
    // Imagens
    "imagens.ver",
    "imagens.criar",
    "imagens.editar",
    "imagens.eliminar",
    // Leitura em áreas de suporte
    "tecnicos.ver",
    "procedencias.ver",
    "tipos-exame.ver",
    "relatorios.ver",
    "historico.ver",
    // Chat
    "chat.ver",
    "chat.criar",
    // Atendimento
    "atendimento.ver",
    "atendimento.criar",
    "atendimento.editar",
  ],

  RECEPCAO: [
    "dashboard.ver",
    // Pacientes
    "pacientes.ver",
    "pacientes.criar",
    "pacientes.editar",
    // Agendamentos
    "agendamentos.ver",
    "agendamentos.criar",
    "agendamentos.editar",
    // Exames
    "exames.ver",
    "exames.criar",
    "exames.editar",
    // Histórico (leitura)
    "historico.ver",
    // Chat
    "chat.ver",
    "chat.criar",
    // Atendimento
    "atendimento.ver",
    "atendimento.criar",
    "atendimento.editar",
  ],

  MEDICO: [
    // Dashboard
    "dashboard.ver",
    // Portal do Médico
    "medico.ver",
    "medico.criar",
    "medico.editar",
    // Portal Médico Cognitivo
    "cognitivo.ver",
    "cognitivo.criar",
    "cognitivo.editar",
    // Pacientes (consulta)
    "pacientes.ver",
    // Exames (solicitar/consultar)
    "exames.ver",
    "exames.criar",
    // Imagens (visualização)
    "imagens.ver",
    // Histórico do paciente
    "historico.ver",
    // Tipos de exame (consulta)
    "tipos-exame.ver",
    // Comunicação com radiologistas
    "chat.ver",
    "chat.criar",
    // Atendimento (consulta)
    "atendimento.ver",
  ],
};

/**
 * Verifica se uma role tem permissão para (módulo, ação).
 * Função pura — utilizável em client e server.
 */
export function temPermissao(
  role: Role | string | null | undefined,
  modulo: Modulo,
  acao: Acao = "ver"
): boolean {
  if (!role) return false;
  const perms = PERMISSOES[role as Role];
  if (!perms) return false;
  if (perms.includes("*.*")) return true;
  return perms.includes(`${modulo}.${acao}`);
}

/** Retorna as permissões (array) de uma role. Útil para depuração/UI. */
export function obterPermissoes(role: Role): PermissaoString[] {
  return PERMISSOES[role] || [];
}

/** Módulo associado a cada item do menu lateral. */
export const MENU_MODULOS: Record<string, Modulo> = {
  "/dashboard": "dashboard",
  "/pacientes": "pacientes",
  "/agendamentos": "agendamentos",
  "/turnos": "turnos",
  "/exames": "exames",
  "/imagens": "imagens",
  "/tecnicos": "tecnicos",
  "/procedencias": "procedencias",
  "/relatorios": "relatorios",
  "/utilizadores": "utilizadores",
  "/configuracoes": "configuracoes",
  "/historico": "historico",
  "/chat": "chat",
  // Portal do Médico
  "/medico": "medico",
  "/medico/solicitar": "medico",
  "/medico/acompanhamento": "medico",
  "/medico/comparar": "medico",
  "/medico/agenda": "medico",
  "/medico/notificacoes": "medico",
  "/medico/exames": "medico",
  "/medico/pacientes": "medico",
  // Portal Médico Cognitivo
  "/cognitivo": "cognitivo",
  "/cognitivo/linha-temporal": "cognitivo",
  "/cognitivo/digital-twin": "cognitivo",
  "/cognitivo/evolucao": "cognitivo",
  "/cognitivo/detector-mudancas": "cognitivo",
  "/cognitivo/assistente": "cognitivo",
  "/cognitivo/memoria-clinica": "cognitivo",
  "/cognitivo/contradicoes": "cognitivo",
  "/cognitivo/radar-epidemiologico": "cognitivo",
  "/cognitivo/previsao": "cognitivo",
  "/cognitivo/segunda-opiniao": "cognitivo",
  "/cognitivo/reunioes": "cognitivo",
  "/cognitivo/pesquisa": "cognitivo",
  "/cognitivo/ia-generativa": "cognitivo",
  // Atendimento
  "/atendimento": "atendimento",
  "/atendimento/consultas": "atendimento",
  "/atendimento/urgencias": "atendimento",
  "/atendimento/encaminhamentos": "atendimento",
  "/atendimento/fila": "atendimento",
  "/atendimento/dashboard": "atendimento",
  "/atendimento/relatorios": "atendimento",
};
