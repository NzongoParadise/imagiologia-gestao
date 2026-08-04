// ---------------------------------------------------------------------------
// Sistema de Permissões (RBAC)
// Módulo puro — seguro para importar em client e server components.
// ---------------------------------------------------------------------------

export type Role = "ADMIN" | "TECNICO" | "RECEPCAO";

export const ROLES: Role[] = ["ADMIN", "TECNICO", "RECEPCAO"];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  TECNICO: "Técnico",
  RECEPCAO: "Receção",
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
  | "chat";

export type Acao = "ver" | "criar" | "editar" | "eliminar";

export type PermissaoString = string; // ex: "exames.criar"

/**
 * Matriz de permissões por role.
 * - "ADMIN" possui acesso total ("*.*").
 * - "TECNICO" tem acesso de gestão às áreas técnicas e clínicas.
 * - "RECEPCAO" tem acesso de front-office (pacientes, agendamentos, exames).
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
};

