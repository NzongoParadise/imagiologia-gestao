"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UserPlus,
  CheckCircle2,
  Printer,
  Stethoscope,
  Building2,
  User,
  Search,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertTriangle,
  Clock,
  FileText,
  MapPin,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { usePermissoes } from "@/hooks/use-permissoes";
import {
  PedidosEReceita,
  type MedicamentoFormulario,
  type PedidoFormulario,
} from "@/features/atendimento/components/pedidos-e-receita";
import {
  iniciarConsulta,
  concluirConsulta,
  registarPedidosEReceita,
} from "@/server/actions/atendimento-actions";

interface Especialidade {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

interface Paciente {
  id: number;
  nome: string;
  numeroProcesso: string | null;
}

interface Consultorio {
  id: number;
  numero: string;
  nome: string;
  especialidadeId?: number | null;
  especialidade?: {
    id: number;
    nome: string;
  } | null;
  capacidade?: number;
  bloco?: string | null;
  andar?: string | null;
}

interface ConsultaAtendimento {
  id: number;
  codigo: string;
  estado: string;
  prioridade: string;
  criadoEm: string;
  paciente: { id: number; nome: string; numeroProcesso: string | null };
  especialidade: { id: number; nome: string } | null;
  senha: { codigo: string } | null;
  consulta: {
    medico: { id: number; nome: string } | null;
    diagnostico: string | null;
    concluidoEm: string | null;
  } | null;
  criadoPor: { id: number; nome: string } | null;
}

interface FichaConsulta {
  senha: string;
  paciente: string;
  especialidade: string;
  prioridade: string;
}

function escaparHtml(valor: string) {
  return valor.replace(
    /[&<>\"]/g,
    (caractere) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
      }[caractere] || caractere)
  );
}

function imprimirFicha(ficha: FichaConsulta) {
  const janela = window.open("", "_blank", "width=420,height=600");
  if (!janela) return toast.error("Permita janelas pop-up para imprimir a ficha");
  janela.document.write(`<!doctype html><html><head><title>Senha ${escaparHtml(
    ficha.senha
  )}</title><style>body{font-family:Arial;padding:18px;text-align:center;color:#111}.f{border:2px dashed;padding:20px}.h{font-size:12px;font-weight:bold}.s{font-size:52px;font-weight:800;margin:18px 0}.n{font-size:18px;font-weight:bold}.d{font-size:12px;color:#444;margin-top:6px}@media print{body{padding:0}.f{border:0}}</style></head><body><div class="f"><div class="h">GESTAO HOSPITALAR</div><div class="d">FICHA DE CONSULTA</div><div class="s">${escaparHtml(
    ficha.senha
  )}</div><div class="n">${escaparHtml(
    ficha.paciente
  )}</div><div class="d">${escaparHtml(
    ficha.especialidade
  )}</div><div class="d">Prioridade: ${escaparHtml(
    ficha.prioridade
  )}</div></div><script>window.onload=()=>window.print()</script></body></html>`);
  janela.document.close();
}

interface ConsultasClientProps {
  especialidades: Especialidade[];
  pacientes: Paciente[];
  tiposExame: { id: number; nome: string; modalidade: string | null }[];
  atendimentos: ConsultaAtendimento[];
  consultoriosIniciais?: Consultorio[];
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

export function ConsultasClient({
  especialidades,
  pacientes,
  tiposExame,
  atendimentos,
  consultoriosIniciais = [],
}: ConsultasClientProps) {
  const router = useRouter();
  const { pode } = usePermissoes();

  // Modais
  const [criarOpen, setCriarOpen] = useState(false);
  const [concluirOpen, setConcluirOpen] = useState<ConsultaAtendimento | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ultimaFicha, setUltimaFicha] = useState<FichaConsulta | null>(null);

  // Consultórios carregados
  const [todosConsultorios, setTodosConsultorios] = useState<Consultorio[]>(consultoriosIniciais);
  const [carregandoConsultorios, setCarregandoConsultorios] = useState(false);

  // --- Wizard de Criação de Consulta (Etapas 1, 2, 3, 4) ---
  const [etapa, setEtapa] = useState<1 | 2 | 3 | 4>(1);

  // Filtros de busca nas etapas do Wizard
  const [buscaEspecialidade, setBuscaEspecialidade] = useState("");
  const [buscaConsultorio, setBuscaConsultorio] = useState("");
  const [buscaPaciente, setBuscaPaciente] = useState("");

  // Dados do formulário
  const [especialidadeId, setEspecialidadeId] = useState("");
  const [consultorioId, setConsultorioId] = useState("");
  const [pacienteId, setPacienteId] = useState("");
  const [tipoConsulta, setTipoConsulta] = useState("Primeira Consulta");
  const [prioridade, setPrioridade] = useState("Normal");
  const [origem, setOrigem] = useState("rececao");
  const [motivo, setMotivo] = useState("");

  // Carregar consultórios se a lista inicial estiver vazia
  useEffect(() => {
    if (todosConsultorios.length === 0) {
      setCarregandoConsultorios(true);
      fetch("/api/consultorios")
        .then((res) => (res.ok ? res.json() : []))
        .then((dados) => {
          if (Array.isArray(dados) && dados.length > 0) {
            setTodosConsultorios(dados);
          }
        })
        .catch((err) => console.error("Erro ao carregar consultórios:", err))
        .finally(() => setCarregandoConsultorios(false));
    }
  }, [todosConsultorios.length]);

  // Especialidades filtradas por pesquisa
  const especialidadesFiltradas = useMemo(() => {
    if (!buscaEspecialidade.trim()) return especialidades;
    const termo = buscaEspecialidade.toLowerCase();
    return especialidades.filter(
      (e) =>
        e.nome.toLowerCase().includes(termo) ||
        (e.descricao && e.descricao.toLowerCase().includes(termo))
    );
  }, [especialidades, buscaEspecialidade]);

  // Consultórios vinculados à especialidade selecionada
  const consultoriosDaEspecialidade = useMemo(() => {
    if (!especialidadeId) return todosConsultorios;
    const espId = Number(especialidadeId);
    const diretos = todosConsultorios.filter(
      (c) => c.especialidadeId === espId || c.especialidade?.id === espId
    );
    if (diretos.length > 0) return diretos;
    // Se não houver consultório específico, inclui consultórios gerais ou todos
    return todosConsultorios;
  }, [todosConsultorios, especialidadeId]);

  // Consultórios filtrados por pesquisa no Step 2
  const consultoriosFiltrados = useMemo(() => {
    if (!buscaConsultorio.trim()) return consultoriosDaEspecialidade;
    const termo = buscaConsultorio.toLowerCase();
    return consultoriosDaEspecialidade.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        c.numero.toLowerCase().includes(termo) ||
        (c.bloco && c.bloco.toLowerCase().includes(termo))
    );
  }, [consultoriosDaEspecialidade, buscaConsultorio]);

  // Pacientes filtrados por pesquisa no Step 3
  const pacientesFiltrados = useMemo(() => {
    if (!buscaPaciente.trim()) return pacientes.slice(0, 10);
    const termo = buscaPaciente.toLowerCase();
    return pacientes.filter(
      (p) =>
        p.nome.toLowerCase().includes(termo) ||
        (p.numeroProcesso && p.numeroProcesso.toLowerCase().includes(termo))
    );
  }, [pacientes, buscaPaciente]);

  // Objectos selecionados para exibição
  const especialidadeSelecionada = useMemo(
    () => especialidades.find((e) => e.id === Number(especialidadeId)),
    [especialidades, especialidadeId]
  );

  const consultorioSelecionado = useMemo(
    () => todosConsultorios.find((c) => c.id === Number(consultorioId)),
    [todosConsultorios, consultorioId]
  );

  const pacienteSelecionado = useMemo(
    () => pacientes.find((p) => p.id === Number(pacienteId)),
    [pacientes, pacienteId]
  );

  // Form concluir consulta
  const [diagnostico, setDiagnostico] = useState("");
  const [sinaisSintomas, setSinaisSintomas] = useState("");
  const [prescricao, setPrescricao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [encDestino, setEncDestino] = useState("");
  const [encMotivo, setEncMotivo] = useState("");
  const [pedidosExame, setPedidosExame] = useState<PedidoFormulario[]>([]);
  const [medicamentos, setMedicamentos] = useState<MedicamentoFormulario[]>([]);
  const [observacoesReceita, setObservacoesReceita] = useState("");

  const resetCriar = () => {
    setEtapa(1);
    setEspecialidadeId("");
    setConsultorioId("");
    setPacienteId("");
    setTipoConsulta("Primeira Consulta");
    setPrioridade("Normal");
    setOrigem("rececao");
    setMotivo("");
    setBuscaEspecialidade("");
    setBuscaConsultorio("");
    setBuscaPaciente("");
  };

  const resetConcluir = () => {
    setDiagnostico("");
    setSinaisSintomas("");
    setPrescricao("");
    setObservacoes("");
    setEncDestino("");
    setEncMotivo("");
    setPedidosExame([]);
    setMedicamentos([]);
    setObservacoesReceita("");
  };

  const handleSelecionarEspecialidade = (id: number) => {
    setEspecialidadeId(String(id));
    // Auto-seleciona consultório vinculado se houver apenas 1
    const salas = todosConsultorios.filter(
      (c) => c.especialidadeId === id || c.especialidade?.id === id
    );
    if (salas.length === 1) {
      setConsultorioId(String(salas[0].id));
    } else {
      setConsultorioId("");
    }
    setEtapa(2);
  };

  const handleSelecionarConsultorio = (id: number) => {
    setConsultorioId(String(id));
    setEtapa(3);
  };

  const handleAvancarParaResumo = () => {
    if (!pacienteId) {
      toast.error("Por favor, selecione um paciente para continuar.");
      return;
    }
    setEtapa(4);
  };

  const handleCriar = async () => {
    if (!pacienteId) {
      toast.error("Selecione um paciente");
      return;
    }
    setSubmitting(true);
    try {
      const atendimento = await iniciarConsulta({
        pacienteId: Number(pacienteId),
        especialidadeId: especialidadeId ? Number(especialidadeId) : undefined,
        consultorioId: consultorioId ? Number(consultorioId) : undefined,
        motivo: motivo
          ? `[${tipoConsulta}] ${motivo}`
          : `[${tipoConsulta}] Atendimento regular`,
        prioridade,
        origem,
      });

      setUltimaFicha({
        senha: atendimento.senha,
        paciente: pacienteSelecionado?.nome || "Paciente",
        especialidade: especialidadeSelecionada?.nome || "Consulta Geral",
        prioridade,
      });

      toast.success("Admissão de consulta registada com sucesso!");
      setCriarOpen(false);
      resetCriar();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao iniciar consulta");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConcluir = async () => {
    if (!concluirOpen) return;
    setSubmitting(true);
    try {
      await concluirConsulta({
        atendimentoId: concluirOpen.id,
        diagnostico: diagnostico || undefined,
        sinaisSintomas: sinaisSintomas || undefined,
        prescricao: prescricao || undefined,
        observacoes: observacoes || undefined,
        encaminharDestino: encDestino || undefined,
        encaminharMotivo: encMotivo || undefined,
      });
      await registarPedidosEReceita({
        atendimentoId: concluirOpen.id,
        pedidosExame: pedidosExame.map((pedido) => ({
          tipoExameId: Number(pedido.tipoExameId),
          prioridade: pedido.prioridade,
          justificativa: pedido.justificativa,
        })),
        medicamentos: medicamentos.map((medicamento) => ({
          ...medicamento,
          duracaoDias: medicamento.duracaoDias
            ? Number(medicamento.duracaoDias)
            : undefined,
        })),
        observacoesReceita,
      });
      toast.success("Consulta concluída com sucesso");
      setConcluirOpen(null);
      resetConcluir();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao concluir consulta");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Consultas Clínicas</h1>
          <p className="text-sm text-muted-foreground">
            Gestão hospitalar de consultas, fila de chamada e atendimento médico
          </p>
        </div>
        {pode("atendimento", "criar") && (
          <Button
            onClick={() => {
              resetCriar();
              setCriarOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
          >
            <UserPlus className="h-4 w-4 mr-1.5" /> Nova Consulta
          </Button>
        )}
      </div>

      {/* Banner de Senha Emitida */}
      {ultimaFicha && (
        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 sm:flex-row sm:items-center sm:justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-sm">
              {ultimaFicha.senha}
            </div>
            <div>
              <p className="font-semibold text-foreground">
                Consulta registada com sucesso — Senha {ultimaFicha.senha}
              </p>
              <p className="text-xs text-muted-foreground">
                Paciente: <strong className="text-foreground">{ultimaFicha.paciente}</strong> | Serviço: {ultimaFicha.especialidade}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="bg-background hover:bg-muted font-medium"
            onClick={() => imprimirFicha(ultimaFicha)}
          >
            <Printer className="h-4 w-4 mr-2" /> Imprimir Ficha / Senha
          </Button>
        </div>
      )}

      {/* Lista de Atendimentos */}
      {atendimentos.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Stethoscope className="h-8 w-8 text-muted-foreground" />}
            title="Sem consultas registadas hoje"
            description="Inicie um novo atendimento de consulta para adicionar pacientes à fila."
            action={
              pode("atendimento", "criar") && (
                <Button
                  onClick={() => {
                    resetCriar();
                    setCriarOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <UserPlus className="h-4 w-4 mr-1.5" /> Nova Consulta
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <Card>
          <CardHeader className="py-4 px-6 border-b">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Atendimentos de Consulta ({atendimentos.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground font-semibold">
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
                  {atendimentos.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-xs text-muted-foreground font-mono">
                        {a.codigo}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                          {a.senha?.codigo || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-foreground">{a.paciente.nome}</div>
                        {a.paciente.numeroProcesso && (
                          <div className="text-xs text-muted-foreground font-mono">
                            {a.paciente.numeroProcesso}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-foreground/90 font-medium">
                        {a.especialidade?.nome || "Geral"}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={(ESTADO_COR[a.estado] as never) || "secondary"}>
                          {ESTADO_LABEL[a.estado] || a.estado}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={
                            a.prioridade === "Urgente"
                              ? "destructive"
                              : a.prioridade === "Prioridade"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {a.prioridade}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {a.consulta?.medico?.nome || "Aguardando"}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            imprimirFicha({
                              senha: a.senha?.codigo || a.codigo,
                              paciente: a.paciente.nome,
                              especialidade:
                                a.especialidade?.nome || "Atendimento clínico",
                              prioridade: a.prioridade,
                            })
                          }
                          title="Imprimir ficha"
                          className="h-8 w-8 p-0"
                        >
                          <Printer className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        {a.estado === "EM_ATENDIMENTO" && pode("atendimento", "editar") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setConcluirOpen(a);
                              resetConcluir();
                            }}
                            className="text-xs"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Concluir
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL WIZARD ENTERPRISE: NOVA CONSULTA (4 ETAPAS)                         */}
      {/* ========================================================================= */}
      <Modal
        open={criarOpen}
        onClose={() => {
          setCriarOpen(false);
          resetCriar();
        }}
        title="Admissão de Consulta Hospitalar"
        description="Fluxo sequencial de alocação de serviço, gabinete e identificação do paciente"
        size="lg"
      >
        <div className="space-y-6">
          {/* Stepper Superior (Barra de Progresso) */}
          <div className="grid grid-cols-4 gap-2 border-b pb-4 text-xs font-medium">
            <div
              className={`flex items-center gap-2 cursor-pointer transition-colors ${
                etapa === 1
                  ? "text-primary font-bold"
                  : etapa > 1
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
              onClick={() => setEtapa(1)}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  etapa > 1
                    ? "bg-emerald-600 text-white"
                    : etapa === 1
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {etapa > 1 ? <Check className="h-3.5 w-3.5" /> : "1"}
              </div>
              <span className="hidden sm:inline">1. Especialidade</span>
            </div>

            <div
              className={`flex items-center gap-2 cursor-pointer transition-colors ${
                etapa === 2
                  ? "text-primary font-bold"
                  : etapa > 2
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
              onClick={() => especialidadeId && setEtapa(2)}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  etapa > 2
                    ? "bg-emerald-600 text-white"
                    : etapa === 2
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {etapa > 2 ? <Check className="h-3.5 w-3.5" /> : "2"}
              </div>
              <span className="hidden sm:inline">2. Consultório</span>
            </div>

            <div
              className={`flex items-center gap-2 cursor-pointer transition-colors ${
                etapa === 3
                  ? "text-primary font-bold"
                  : etapa > 3
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
              onClick={() => consultorioId && setEtapa(3)}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  etapa > 3
                    ? "bg-emerald-600 text-white"
                    : etapa === 3
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {etapa > 3 ? <Check className="h-3.5 w-3.5" /> : "3"}
              </div>
              <span className="hidden sm:inline">3. Paciente</span>
            </div>

            <div
              className={`flex items-center gap-2 cursor-pointer transition-colors ${
                etapa === 4 ? "text-primary font-bold" : "text-muted-foreground"
              }`}
              onClick={() => pacienteId && setEtapa(4)}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  etapa === 4
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                4
              </div>
              <span className="hidden sm:inline">4. Confirmação</span>
            </div>
          </div>

          {/* =================================================================== */}
          {/* ETAPA 1: SELEÇÃO DA ESPECIALIDADE MÉDICA                            */}
          {/* =================================================================== */}
          {etapa === 1 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Selecione o Serviço Clínico / Especialidade
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Escolha a especialidade para direcionar o atendimento
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={buscaEspecialidade}
                    onChange={(e) => setBuscaEspecialidade(e.target.value)}
                    placeholder="Pesquisar especialidade..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {especialidadesFiltradas.length === 0 ? (
                  <div className="col-span-2 py-8 text-center text-sm text-muted-foreground">
                    Nenhuma especialidade encontrada para &quot;{buscaEspecialidade}&quot;.
                  </div>
                ) : (
                  especialidadesFiltradas.map((esp) => {
                    const isSelected = String(esp.id) === especialidadeId;
                    const salasCount = todosConsultorios.filter(
                      (c) => c.especialidadeId === esp.id || c.especialidade?.id === esp.id
                    ).length;

                    return (
                      <div
                        key={esp.id}
                        onClick={() => handleSelecionarEspecialidade(esp.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 hover:border-primary/50 hover:shadow-sm ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "bg-card/70 border-border/70"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                              <Stethoscope className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">
                                {esp.nome}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {esp.descricao || "Consulta médica especializada"}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {salasCount > 0
                              ? `${salasCount} consultório(s)`
                              : "Consultório geral"}
                          </span>
                          <span className="font-medium text-primary inline-flex items-center gap-0.5">
                            Selecionar <ChevronRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* ETAPA 2: SELEÇÃO DO CONSULTÓRIO / GABINETE                          */}
          {/* =================================================================== */}
          {etapa === 2 && (
            <div className="space-y-4">
              {/* Header com Especialidade Selecionada */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Especialidade selecionada</p>
                    <p className="text-sm font-bold text-foreground">
                      {especialidadeSelecionada?.nome}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEtapa(1)}
                  className="text-xs h-8"
                >
                  Alterar Especialidade
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Selecione o Consultório / Gabinete
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Alocação física do consultório para o atendimento
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={buscaConsultorio}
                    onChange={(e) => setBuscaConsultorio(e.target.value)}
                    placeholder="Filtrar sala ou bloco..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                {consultoriosFiltrados.length === 0 ? (
                  <div className="col-span-2 py-8 text-center text-sm text-muted-foreground">
                    Nenhum consultório disponível no momento.
                  </div>
                ) : (
                  consultoriosFiltrados.map((cons) => {
                    const isSelected = String(cons.id) === consultorioId;
                    const isDirectMatch =
                      cons.especialidadeId === Number(especialidadeId) ||
                      cons.especialidade?.id === Number(especialidadeId);

                    return (
                      <div
                        key={cons.id}
                        onClick={() => handleSelecionarConsultorio(cons.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 hover:border-primary/50 hover:shadow-sm ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "bg-card/70 border-border/70"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                              {cons.numero}
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">
                                {cons.nome}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" />
                                {cons.bloco || "Bloco Central"} • {cons.andar || "Piso 1"}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                          {isDirectMatch ? (
                            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                              Alocação Específica
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              Gabinete Multidisciplinar
                            </Badge>
                          )}
                          <span className="font-medium text-primary inline-flex items-center gap-0.5">
                            Avançar <ChevronRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <Button
                  variant="outline"
                  onClick={() => setEtapa(1)}
                  className="flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
                {consultorioId && (
                  <Button
                    onClick={() => setEtapa(3)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                  >
                    Próximo: Paciente <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* ETAPA 3: IDENTIFICAÇÃO DO PACIENTE & DADOS CLÍNICOS                 */}
          {/* =================================================================== */}
          {etapa === 3 && (
            <div className="space-y-4">
              {/* Resumo das etapas anteriores */}
              <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-muted/40 border text-xs">
                <span className="text-muted-foreground">Alocação:</span>
                <Badge variant="secondary" className="font-semibold">
                  {especialidadeSelecionada?.nome}
                </Badge>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                <Badge variant="secondary" className="font-semibold">
                  {consultorioSelecionado?.numero} — {consultorioSelecionado?.nome}
                </Badge>
              </div>

              {/* Busca e Seleção do Paciente */}
              <div className="space-y-2 rounded-xl border bg-card/60 p-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <User className="h-4 w-4 text-primary" />
                    Paciente *
                  </label>
                  {pacienteSelecionado && (
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                      Processo: {pacienteSelecionado.numeroProcesso || "S/N"}
                    </Badge>
                  )}
                </div>

                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={buscaPaciente}
                    onChange={(e) => setBuscaPaciente(e.target.value)}
                    placeholder="Pesquisar por nome do paciente ou nº de processo (ex: António, P-0002)..."
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Lista de Pacientes Correspondentes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-h-36 overflow-y-auto pr-1">
                  {pacientesFiltrados.length === 0 ? (
                    <p className="col-span-2 text-center text-xs text-muted-foreground py-2">
                      Nenhum paciente encontrado com &quot;{buscaPaciente}&quot;.
                    </p>
                  ) : (
                    pacientesFiltrados.map((p) => {
                      const isSel = String(p.id) === pacienteId;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setPacienteId(String(p.id))}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                            isSel
                              ? "border-primary bg-primary/10 font-bold text-primary"
                              : "bg-background hover:border-primary/40 text-foreground"
                          }`}
                        >
                          <div>
                            <p className="font-medium">{p.nome}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {p.numeroProcesso || "Sem processo"}
                            </p>
                          </div>
                          {isSel && <Check className="h-4 w-4 text-primary" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Classificação Hospitalar e Detalhes da Consulta */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">
                    Tipo de Consulta
                  </label>
                  <Select
                    options={[
                      { value: "Primeira Consulta", label: "Primeira Consulta" },
                      { value: "Retorno / Revisão", label: "Retorno / Revisão" },
                      { value: "Acompanhamento", label: "Acompanhamento" },
                      { value: "Urgência Clínica", label: "Urgência Clínica" },
                    ]}
                    value={tipoConsulta}
                    onChange={(e) => setTipoConsulta(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">
                    Prioridade de Atendimento
                  </label>
                  <Select
                    options={[
                      { value: "Normal", label: "Normal (Fluxo regular)" },
                      { value: "Prioridade", label: "Prioridade por Lei (Idosos/PCD)" },
                      { value: "Urgente", label: "Urgente (Atenção imediata)" },
                    ]}
                    value={prioridade}
                    onChange={(e) => setPrioridade(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">
                    Origem / Encaminhamento
                  </label>
                  <Select
                    options={[
                      { value: "rececao", label: "Recepção Central" },
                      { value: "balcao", label: "Balcão Especialidades" },
                      { value: "triagem", label: "Triagem Geral" },
                      { value: "encaminhamento", label: "Encaminhamento Interno" },
                    ]}
                    value={origem}
                    onChange={(e) => setOrigem(e.target.value)}
                  />
                </div>
              </div>

              {/* Motivo da Consulta */}
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Motivo da Consulta / Queixa Principal
                </label>
                <textarea
                  className="min-h-20 w-full rounded-xl border border-input bg-background/60 px-3 py-2 text-xs placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Descreva a queixa principal ou histórico clínico referido pelo paciente..."
                />
              </div>

              {/* Ações de Navegação */}
              <div className="flex items-center justify-between pt-3 border-t">
                <Button
                  variant="outline"
                  onClick={() => setEtapa(2)}
                  className="flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
                <Button
                  onClick={handleAvancarParaResumo}
                  disabled={!pacienteId}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                >
                  Revisar & Confirmar <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* ETAPA 4: RESUMO & CONFIRMAÇÃO DA ADMISSÃO                          */}
          {/* =================================================================== */}
          {etapa === 4 && (
            <div className="space-y-4">
              <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-bold text-foreground text-sm">
                      Ficha de Admissão de Consulta
                    </h3>
                  </div>
                  <Badge variant="outline" className="text-xs font-bold text-primary border-primary/30">
                    Pronta para Emissão
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-muted-foreground">Paciente:</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {pacienteSelecionado?.nome}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Processo: {pacienteSelecionado?.numeroProcesso || "Não atribuído"}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Serviço Clínico:</p>
                    <p className="text-sm font-bold text-primary mt-0.5">
                      {especialidadeSelecionada?.nome}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {tipoConsulta}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Gabinete / Local:</p>
                    <p className="font-semibold text-foreground mt-0.5">
                      {consultorioSelecionado?.numero} — {consultorioSelecionado?.nome}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {consultorioSelecionado?.bloco || "Bloco Central"} • {consultorioSelecionado?.andar || "Piso 1"}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Classificação & Prioridade:</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={
                          prioridade === "Urgente"
                            ? "destructive"
                            : prioridade === "Prioridade"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {prioridade}
                      </Badge>
                      <span className="text-muted-foreground capitalize">• {origem}</span>
                    </div>
                  </div>

                  {motivo && (
                    <div className="col-span-2 pt-2 border-t">
                      <p className="text-muted-foreground">Motivo Clínico Registado:</p>
                      <p className="text-foreground italic mt-0.5 bg-muted/40 p-2 rounded-lg">
                        &quot;{motivo}&quot;
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botões de Ação Final */}
              <div className="flex items-center justify-between pt-3 border-t">
                <Button
                  variant="outline"
                  onClick={() => setEtapa(3)}
                  disabled={submitting}
                  className="flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
                <Button
                  onClick={handleCriar}
                  disabled={submitting}
                  className="min-w-44 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-semibold"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      A emitir senha...
                    </span>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1.5" /> Confirmar e Emitir Senha
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Concluir Consulta */}
      <Modal
        open={!!concluirOpen}
        onClose={() => setConcluirOpen(null)}
        title={concluirOpen ? `Concluir Consulta — ${concluirOpen.codigo}` : ""}
        description={concluirOpen ? `Paciente: ${concluirOpen.paciente.nome}` : ""}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Sinais e Sintomas</label>
            <textarea
              className="min-h-15 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={sinaisSintomas}
              onChange={(e) => setSinaisSintomas(e.target.value)}
              placeholder="Sinais e sintomas observados"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Diagnóstico</label>
            <textarea
              className="min-h-15 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              placeholder="Diagnóstico clínico"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Prescrição</label>
            <textarea
              className="min-h-15 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={prescricao}
              onChange={(e) => setPrescricao(e.target.value)}
              placeholder="Prescrição / medicação indicada"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Observações</label>
            <textarea
              className="min-h-15 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Encaminhar para</label>
              <input
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={encDestino}
                onChange={(e) => setEncDestino(e.target.value)}
                placeholder="Ex: Cardiologia, Internamento"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Motivo Encaminhamento</label>
              <input
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={encMotivo}
                onChange={(e) => setEncMotivo(e.target.value)}
                placeholder="Motivo do encaminhamento"
              />
            </div>
          </div>

          <PedidosEReceita
            tiposExame={tiposExame}
            pedidos={pedidosExame}
            onPedidosChange={setPedidosExame}
            medicamentos={medicamentos}
            onMedicamentosChange={setMedicamentos}
            observacoes={observacoesReceita}
            onObservacoesChange={setObservacoesReceita}
          />

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => setConcluirOpen(null)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConcluir}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting ? "A concluir..." : "Concluir Atendimento"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
