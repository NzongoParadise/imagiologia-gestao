"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Stethoscope,
  AlertTriangle,
  ClipboardList,
  ArrowRightLeft,
  Activity,
  Users,
  Clock,
  CheckCircle2,
  UserPlus,
  Phone,
  TrendingUp,
  Building2,
  ListOrdered,
  Printer,
  ChevronRight,
  ShieldCheck,
  Search,
  BellRing,
  ArrowUpRight,
  Sparkles,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { usePermissoes } from "@/hooks/use-permissoes";

interface Estatisticas {
  totalHoje: number;
  consultasHoje: number;
  urgenciasHoje: number;
  aguardando: number;
  emAtendimento: number;
  concluidos: number;
  encaminhamentosPendentes: number;
  porEstado: { estado: string; _count: number }[];
}

interface Especialidade {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

interface BancoUrgencia {
  id: number;
  nome: string;
  tipo: string;
  descricao: string | null;
  ativo: boolean;
}

interface ClassificacaoRisco {
  id: number;
  nome: string;
  cor: string;
  nivel: number;
  tempoMaximo?: number | null;
  descricao: string | null;
  ativo: boolean;
}

interface ConsultaItem {
  id: number;
  codigo: string;
  estado: string;
  prioridade: string;
  criadoEm: string;
  paciente: { id: number; nome: string; numeroProcesso: string | null };
  especialidade: { id: number; nome: string } | null;
  senha: { codigo: string; status: string } | null;
  consulta: { medico: { id: number; nome: string } | null } | null;
}

interface UrgenciaItem {
  id: number;
  codigo: string;
  estado: string;
  prioridade: string;
  criadoEm: string;
  paciente: { id: number; nome: string; numeroProcesso: string | null };
  urgencia: {
    bancoUrgencia: { id: number; nome: string; tipo: string } | null;
    classificacao: { id: number; nome: string; cor: string; tempoMaximo?: number | null } | null;
    medico: { id: number; nome: string } | null;
  } | null;
  senha: { codigo: string; status: string } | null;
}

interface FilaItem {
  id: number;
  posicao: number;
  status: string;
  tipoFila: string;
  atendimento: {
    id: number;
    codigo: string;
    tipo: string;
    paciente: { id: number; nome: string; numeroProcesso: string | null };
    especialidade: { id: number; nome: string } | null;
    senha: { codigo: string } | null;
  };
  especialidade: { id: number; nome: string } | null;
}

interface EncaminhamentoItem {
  id: number;
  destino: string;
  motivo: string;
  prioridade: string;
  estado: string;
  criadoEm: string;
  paciente: { id: number; nome: string; numeroProcesso: string | null };
  atendimento: { id: number; codigo: string; tipo: string };
}

interface ConsultorioItem {
  id: number;
  numero: string;
  nome: string;
  bloco?: string | null;
  andar?: string | null;
  especialidade?: { id: number; nome: string } | null;
}

interface AtendimentoClientProps {
  estatisticas: Estatisticas;
  especialidades: Especialidade[];
  bancosUrgencia: BancoUrgencia[];
  classificacoesRisco: ClassificacaoRisco[];
  consultasRecentes?: ConsultaItem[];
  urgenciasRecentes?: UrgenciaItem[];
  filaAtendimento?: FilaItem[];
  encaminhamentos?: EncaminhamentoItem[];
  consultorios?: ConsultorioItem[];
}

const ESTADO_COR: Record<string, string> = {
  AGUARDANDO: "warning",
  EM_TRIAGEM: "info",
  EM_ATENDIMENTO: "default",
  CONCLUIDO: "success",
  CANCELADO: "destructive",
  ENCAMINHADO: "secondary",
};

const ESTADO_LABEL: Record<string, string> = {
  AGUARDANDO: "Aguardando",
  EM_TRIAGEM: "Em triagem",
  EM_ATENDIMENTO: "Em atendimento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
  ENCAMINHADO: "Encaminhado",
};

const COR_MANCHESTER: Record<string, { bg: string; text: string; label: string }> = {
  vermelho: { bg: "bg-red-500 text-white", text: "text-red-600", label: "Emergência (Imediato)" },
  laranja: { bg: "bg-orange-500 text-white", text: "text-orange-600", label: "Muito Urgente (10 min)" },
  amarelo: { bg: "bg-amber-400 text-slate-950", text: "text-amber-600", label: "Urgente (60 min)" },
  verde: { bg: "bg-emerald-500 text-white", text: "text-emerald-600", label: "Pouco Urgente (120 min)" },
  azul: { bg: "bg-blue-500 text-white", text: "text-blue-600", label: "Não Urgente (240 min)" },
};

export function AtendimentoClient({
  estatisticas,
  especialidades,
  bancosUrgencia,
  classificacoesRisco,
  consultasRecentes = [],
  urgenciasRecentes = [],
  filaAtendimento = [],
  encaminhamentos = [],
  consultorios = [],
}: AtendimentoClientProps) {
  const router = useRouter();
  const { pode } = usePermissoes();

  // Tab ativa na Central de Atendimento
  const [abaAtiva, setAbaAtiva] = useState<
    "visao-geral" | "consultas" | "urgencias" | "fila" | "encaminhamentos"
  >("visao-geral");

  // Filtro de busca unificado
  const [termoBusca, setTermoBusca] = useState("");

  const cartoesMetricas = [
    {
      titulo: "Total de Atendimentos",
      valor: estatisticas.totalHoje,
      icon: Activity,
      cor: "bg-blue-500/10 text-blue-600",
      desc: "Registados hoje",
    },
    {
      titulo: "Consultas Ambulatoriais",
      valor: estatisticas.consultasHoje,
      icon: Stethoscope,
      cor: "bg-emerald-500/10 text-emerald-600",
      desc: "Serviço ambulatorial",
    },
    {
      titulo: "Banco de Urgência",
      valor: estatisticas.urgenciasHoje,
      icon: AlertTriangle,
      cor: "bg-red-500/10 text-red-600",
      desc: "Triagem & Manchester",
    },
    {
      titulo: "Pacientes em Espera",
      valor: estatisticas.aguardando,
      icon: Users,
      cor: "bg-amber-500/10 text-amber-600",
      desc: "Aguardando chamada",
    },
    {
      titulo: "Em Atendimento Médico",
      valor: estatisticas.emAtendimento,
      icon: Clock,
      cor: "bg-violet-500/10 text-violet-600",
      desc: "Nos gabinetes/salas",
    },
    {
      titulo: "Atendimentos Concluídos",
      valor: estatisticas.concluidos,
      icon: CheckCircle2,
      cor: "bg-green-500/10 text-green-600",
      desc: "Finalizados hoje",
    },
  ];

  // Consultas filtradas por busca
  const consultasFiltradas = useMemo(() => {
    if (!termoBusca.trim()) return consultasRecentes;
    const t = termoBusca.toLowerCase();
    return consultasRecentes.filter(
      (c) =>
        c.codigo.toLowerCase().includes(t) ||
        c.paciente.nome.toLowerCase().includes(t) ||
        (c.paciente.numeroProcesso && c.paciente.numeroProcesso.toLowerCase().includes(t)) ||
        (c.especialidade?.nome && c.especialidade.nome.toLowerCase().includes(t))
    );
  }, [consultasRecentes, termoBusca]);

  // Urgências filtradas por busca
  const urgenciasFiltradas = useMemo(() => {
    if (!termoBusca.trim()) return urgenciasRecentes;
    const t = termoBusca.toLowerCase();
    return urgenciasRecentes.filter(
      (u) =>
        u.codigo.toLowerCase().includes(t) ||
        u.paciente.nome.toLowerCase().includes(t) ||
        (u.paciente.numeroProcesso && u.paciente.numeroProcesso.toLowerCase().includes(t)) ||
        (u.urgencia?.bancoUrgencia?.nome &&
          u.urgencia.bancoUrgencia.nome.toLowerCase().includes(t))
    );
  }, [urgenciasRecentes, termoBusca]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* CABEÇALHO UNIFICADO COM AÇÕES RÁPIDAS PRIMÁRIAS                           */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-900/20 via-primary/10 to-card border shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <ShieldCheck className="h-3.5 w-3.5" /> Central Unificada de Atendimento Hospitalar
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Receção & Triagem Clínica
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestão integrada de fluxo de pacientes, admissão de consultas, urgências e monitor de chamadas
          </p>
        </div>

        {pode("atendimento", "criar") && (
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/atendimento/consultas"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus className="h-4 w-4" /> + Nova Consulta
            </Link>

            <Link
              href="/atendimento/urgencias"
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-red-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <AlertTriangle className="h-4 w-4" /> + Nova Urgência
            </Link>

            <Link
              href="/consultorios"
              className="inline-flex items-center gap-2 rounded-xl border bg-card/80 px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Building2 className="h-4 w-4 text-primary" /> Consultórios
            </Link>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MÉTRICAS CHAVE DO DIA (KPIs)                                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cartoesMetricas.map((c) => (
          <Card key={c.titulo} className="border bg-card/70 hover:border-primary/40 transition-colors">
            <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
              <div className="flex items-center justify-between">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.cor}`}>
                  <c.icon className="h-4 w-4" />
                </div>
                <span className="text-xl font-bold text-foreground">{c.valor}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground line-clamp-1">{c.titulo}</p>
                <p className="text-[10px] text-muted-foreground">{c.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* NAVEGAÇÃO EM ABAS (TABS) — SEM RECARREGAMENTO DE PÁGINA                   */}
      {/* ========================================================================= */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-2">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-muted/60 border text-xs font-medium">
            <button
              onClick={() => setAbaAtiva("visao-geral")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                abaAtiva === "visao-geral"
                  ? "bg-card text-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              <Activity className="h-4 w-4 text-primary" /> Visão Geral do Hospital
            </button>

            <button
              onClick={() => setAbaAtiva("consultas")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                abaAtiva === "consultas"
                  ? "bg-card text-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              <Stethoscope className="h-4 w-4 text-emerald-600" /> Fila de Consultas ({consultasRecentes.length})
            </button>

            <button
              onClick={() => setAbaAtiva("urgencias")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                abaAtiva === "urgencias"
                  ? "bg-card text-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              <AlertTriangle className="h-4 w-4 text-red-600" /> Banco de Urgências ({urgenciasRecentes.length})
            </button>

            <button
              onClick={() => setAbaAtiva("fila")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                abaAtiva === "fila"
                  ? "bg-card text-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              <ListOrdered className="h-4 w-4 text-violet-600" /> Painel de Chamadas
            </button>

            <button
              onClick={() => setAbaAtiva("encaminhamentos")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                abaAtiva === "encaminhamentos"
                  ? "bg-card text-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              <ArrowRightLeft className="h-4 w-4 text-orange-600" /> Encaminhamentos ({encaminhamentos.length})
            </button>
          </div>

          {(abaAtiva === "consultas" || abaAtiva === "urgencias") && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="Pesquisar paciente ou código..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* ABA 1: VISÃO GERAL & OCUPAÇÃO                                         */}
        {/* ===================================================================== */}
        {abaAtiva === "visao-geral" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Ocupação e Módulos Rápidos */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" /> Consultórios & Gabinetes Alocados
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {consultorios.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Sem consultórios registados</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {consultorios.slice(0, 6).map((c) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-xl border bg-muted/20 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                              {c.numero}
                            </div>
                            <div>
                              <p className="font-semibold text-xs text-foreground">{c.nome}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {c.especialidade?.nome || "Uso Geral"} • {c.bloco || "Bloco Central"}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            Disponível
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 pt-2 border-t text-right">
                    <Link
                      href="/consultorios"
                      className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Gerir todos os consultórios ({consultorios.length}) <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Classificação de Risco Manchester */}
              <Card>
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" /> Protocolo de Triagem Manchester (Urgências)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {classificacoesRisco.map((cr) => {
                      const est = COR_MANCHESTER[cr.cor.toLowerCase()] || {
                        bg: "bg-muted text-foreground",
                        label: cr.nome,
                      };
                      return (
                        <div
                          key={cr.id}
                          className={`p-3 rounded-xl ${est.bg} flex flex-col justify-between text-xs shadow-sm`}
                        >
                          <span className="font-bold">{cr.nome}</span>
                          <span className="text-[10px] opacity-90 mt-1">
                            {cr.tempoMaximo === 0 ? "Imediato" : `Meta: ${cr.tempoMaximo} min`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Painel Lateral de Distribuição */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> Distribuição por Estado
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2.5">
                  {estatisticas.porEstado.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">Sem atendimentos hoje</p>
                  ) : (
                    estatisticas.porEstado.map((e) => (
                      <div key={e.estado} className="flex items-center justify-between text-xs">
                        <Badge variant={(ESTADO_COR[e.estado] as never) || "secondary"}>
                          {ESTADO_LABEL[e.estado] || e.estado}
                        </Badge>
                        <span className="font-bold text-foreground">{e._count}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-emerald-600" /> Especialidades Médicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {especialidades.slice(0, 5).map((esp) => (
                    <div key={esp.id} className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{esp.nome}</span>
                      <span className="text-[11px] text-emerald-600 font-semibold">Ativa</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t text-right">
                    <Link
                      href="/atendimento/consultas"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Abrir Consulta Especializada ➔
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* ABA 2: FILA DE CONSULTAS DO DIA                                       */}
        {/* ===================================================================== */}
        {abaAtiva === "consultas" && (
          <Card>
            <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-emerald-600" /> Consultas Ambulatoriais Registadas Hoje
                </CardTitle>
                <CardDescription className="text-xs">
                  Atendimentos em fila e em consultório
                </CardDescription>
              </div>
              <Link href="/atendimento/consultas">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                  <UserPlus className="h-3.5 w-3.5 mr-1" /> Abrir Nova Consulta
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {consultasFiltradas.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Nenhuma consulta encontrada hoje.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left uppercase tracking-wider text-muted-foreground font-semibold">
                        <th className="px-5 py-3">Código</th>
                        <th className="px-5 py-3">Senha</th>
                        <th className="px-5 py-3">Paciente</th>
                        <th className="px-5 py-3">Especialidade</th>
                        <th className="px-5 py-3">Estado</th>
                        <th className="px-5 py-3">Prioridade</th>
                        <th className="px-5 py-3">Médico</th>
                        <th className="px-5 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {consultasFiltradas.map((c) => (
                        <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3.5 font-mono text-muted-foreground">{c.codigo}</td>
                          <td className="px-5 py-3.5">
                            <span className="font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                              {c.senha?.codigo || "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-medium text-foreground">
                            {c.paciente.nome}
                            {c.paciente.numeroProcesso && (
                              <span className="block text-[10px] text-muted-foreground font-mono">
                                {c.paciente.numeroProcesso}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">{c.especialidade?.nome || "Geral"}</td>
                          <td className="px-5 py-3.5">
                            <Badge variant={(ESTADO_COR[c.estado] as never) || "secondary"}>
                              {ESTADO_LABEL[c.estado] || c.estado}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge
                              variant={
                                c.prioridade === "Urgente"
                                  ? "destructive"
                                  : c.prioridade === "Prioridade"
                                  ? "warning"
                                  : "secondary"
                              }
                            >
                              {c.prioridade}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground">
                            {c.consulta?.medico?.nome || "Aguardando"}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Link href="/atendimento/consultas">
                              <Button size="sm" variant="outline" className="text-xs h-7">
                                Ver Detalhes
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ===================================================================== */}
        {/* ABA 3: BANCO DE URGÊNCIAS & TRIAGEM MANCHESTER                        */}
        {/* ===================================================================== */}
        {abaAtiva === "urgencias" && (
          <Card>
            <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" /> Atendimentos do Banco de Urgência
                </CardTitle>
                <CardDescription className="text-xs">
                  Triagem com Protocolo Manchester e metas de tempo
                </CardDescription>
              </div>
              <Link href="/atendimento/urgencias">
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" /> + Nova Urgência
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {urgenciasFiltradas.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Nenhum atendimento de urgência registado hoje.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left uppercase tracking-wider text-muted-foreground font-semibold">
                        <th className="px-5 py-3">Código</th>
                        <th className="px-5 py-3">Senha</th>
                        <th className="px-5 py-3">Paciente</th>
                        <th className="px-5 py-3">Banco</th>
                        <th className="px-5 py-3">Classificação de Risco</th>
                        <th className="px-5 py-3">Estado</th>
                        <th className="px-5 py-3">Médico</th>
                        <th className="px-5 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {urgenciasFiltradas.map((u) => {
                        const corNome = u.urgencia?.classificacao?.cor?.toLowerCase() || "verde";
                        const manchester = COR_MANCHESTER[corNome] || {
                          bg: "bg-muted text-foreground",
                          label: u.urgencia?.classificacao?.nome || "Triagem",
                        };

                        return (
                          <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-5 py-3.5 font-mono text-muted-foreground">{u.codigo}</td>
                            <td className="px-5 py-3.5">
                              <span className="font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-600 border border-red-500/20">
                                {u.senha?.codigo || "—"}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-medium text-foreground">
                              {u.paciente.nome}
                              {u.paciente.numeroProcesso && (
                                <span className="block text-[10px] text-muted-foreground font-mono">
                                  {u.paciente.numeroProcesso}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 font-medium">
                              {u.urgencia?.bancoUrgencia?.nome || "Urgência Geral"}
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[11px] ${manchester.bg}`}
                              >
                                {u.urgencia?.classificacao?.nome || "Sem classificação"}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <Badge variant={(ESTADO_COR[u.estado] as never) || "secondary"}>
                                {ESTADO_LABEL[u.estado] || u.estado}
                              </Badge>
                            </td>
                            <td className="px-5 py-3.5 text-muted-foreground">
                              {u.urgencia?.medico?.nome || "Aguardando"}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <Link href="/atendimento/urgencias">
                                <Button size="sm" variant="outline" className="text-xs h-7">
                                  Ver Atendimento
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ===================================================================== */}
        {/* ABA 4: PAINEL DE CHAMADAS & SENHAS                                    */}
        {/* ===================================================================== */}
        {abaAtiva === "fila" && (
          <Card>
            <CardHeader className="py-4 px-6 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-violet-600" /> Fila e Painel de Chamada em Tempo Real
              </CardTitle>
              <CardDescription className="text-xs">
                Monitor de senhas emitidas e ordem de atendimento nos consultórios
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {filaAtendimento.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Nenhum paciente na fila de chamadas no momento.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left uppercase tracking-wider text-muted-foreground font-semibold">
                        <th className="px-5 py-3">Posição</th>
                        <th className="px-5 py-3">Senha</th>
                        <th className="px-5 py-3">Tipo</th>
                        <th className="px-5 py-3">Paciente</th>
                        <th className="px-5 py-3">Serviço Clínico</th>
                        <th className="px-5 py-3">Status da Fila</th>
                        <th className="px-5 py-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filaAtendimento.map((f) => (
                        <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-sm text-primary">
                            #{f.posicao}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-extrabold px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-sm">
                              {f.atendimento.senha?.codigo || f.atendimento.codigo}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant={f.atendimento.tipo === "URGENCIA" ? "destructive" : "secondary"}>
                              {f.atendimento.tipo}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 font-medium text-foreground">
                            {f.atendimento.paciente.nome}
                          </td>
                          <td className="px-5 py-3.5">
                            {f.especialidade?.nome || f.atendimento.especialidade?.nome || "Geral"}
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant={f.status === "CHAMADO" ? "warning" : "secondary"}>
                              {f.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => toast.success(`Chamando senha ${f.atendimento.senha?.codigo || f.atendimento.codigo}`)}
                            >
                              <BellRing className="h-3.5 w-3.5 mr-1" /> Chamar Paciente
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ===================================================================== */}
        {/* ABA 5: ENCAMINHAMENTOS PENDENTES                                      */}
        {/* ===================================================================== */}
        {abaAtiva === "encaminhamentos" && (
          <Card>
            <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-orange-600" /> Encaminhamentos Clínicos Pendentes
                </CardTitle>
                <CardDescription className="text-xs">
                  Transferências entre serviços hospitalares e especialidades
                </CardDescription>
              </div>
              <Link href="/atendimento/encaminhamentos">
                <Button size="sm" variant="outline" className="text-xs">
                  Ver Todos os Encaminhamentos
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {encaminhamentos.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Nenhum encaminhamento pendente.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left uppercase tracking-wider text-muted-foreground font-semibold">
                        <th className="px-5 py-3">Paciente</th>
                        <th className="px-5 py-3">Destino</th>
                        <th className="px-5 py-3">Motivo</th>
                        <th className="px-5 py-3">Prioridade</th>
                        <th className="px-5 py-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {encaminhamentos.map((enc) => (
                        <tr key={enc.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-foreground">
                            {enc.paciente.nome}
                            {enc.paciente.numeroProcesso && (
                              <span className="block text-[10px] text-muted-foreground font-mono">
                                {enc.paciente.numeroProcesso}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-primary">{enc.destino}</td>
                          <td className="px-5 py-3.5 text-muted-foreground max-w-xs truncate">{enc.motivo}</td>
                          <td className="px-5 py-3.5">
                            <Badge variant={enc.prioridade === "Urgente" ? "destructive" : "secondary"}>
                              {enc.prioridade}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant="warning">{enc.estado}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
