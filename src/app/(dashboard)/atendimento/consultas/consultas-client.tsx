"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, PhoneCall, CheckCircle2, ArrowRightLeft, Printer, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { usePermissoes } from "@/hooks/use-permissoes";
import { PedidosEReceita, type MedicamentoFormulario, type PedidoFormulario } from "@/features/atendimento/components/pedidos-e-receita";
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
  especialidade?: {
    id: number;
    nome: string;
  };
  capacidade: number;
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
  return valor.replace(/[&<>\"]/g, (caractere) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[caractere] || caractere);
}

function imprimirFicha(ficha: FichaConsulta) {
  const janela = window.open("", "_blank", "width=420,height=600");
  if (!janela) return toast.error("Permita janelas pop-up para imprimir a ficha");
  janela.document.write(`<!doctype html><html><head><title>Senha ${escaparHtml(ficha.senha)}</title><style>body{font-family:Arial;padding:18px;text-align:center;color:#111}.f{border:2px dashed;padding:20px}.h{font-size:12px;font-weight:bold}.s{font-size:52px;font-weight:800;margin:18px 0}.n{font-size:18px;font-weight:bold}.d{font-size:12px;color:#444;margin-top:6px}@media print{body{padding:0}.f{border:0}}</style></head><body><div class="f"><div class="h">GESTAO HOSPITALAR</div><div class="d">FICHA DE CONSULTA</div><div class="s">${escaparHtml(ficha.senha)}</div><div class="n">${escaparHtml(ficha.paciente)}</div><div class="d">${escaparHtml(ficha.especialidade)}</div><div class="d">Prioridade: ${escaparHtml(ficha.prioridade)}</div></div><script>window.onload=()=>window.print()</script></body></html>`);
  janela.document.close();
}

interface ConsultasClientProps {
  especialidades: Especialidade[];
  pacientes: Paciente[];
  tiposExame: { id: number; nome: string; modalidade: string | null }[];
  atendimentos: ConsultaAtendimento[];
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
}: ConsultasClientProps) {
  const router = useRouter();
  const { pode } = usePermissoes();
  const [criarOpen, setCriarOpen] = useState(false);
  const [concluirOpen, setConcluirOpen] = useState<ConsultaAtendimento | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ultimaFicha, setUltimaFicha] = useState<FichaConsulta | null>(null);
  const [consultórios, setConsultórios] = useState<Consultorio[]>([]);
  const [carregandoConsultórios, setCarregandoConsultórios] = useState(false);

  // Form estado
  const [pacienteId, setPacienteId] = useState("");
  const [especialidadeId, setEspecialidadeId] = useState("");
  const [consultorioId, setConsultorioId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [prioridade, setPrioridade] = useState("Normal");

  // Carregar consultórios quando especialidade muda
  useEffect(() => {
    if (!especialidadeId) {
      setConsultórios([]);
      setConsultorioId("");
      return;
    }

    const carregarConsultórios = async () => {
      setCarregandoConsultórios(true);
      try {
        const response = await fetch(
          `/api/consultórios?especialidadeId=${especialidadeId}`
        );
        const dados = await response.json();
        setConsultórios(dados);
      } catch (error) {
        console.error("Erro ao carregar consultórios:", error);
      } finally {
        setCarregandoConsultórios(false);
      }
    };

    carregarConsultórios();
  }, [especialidadeId]);

  // Form concluir
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
    setPacienteId("");
    setEspecialidadeId("");
    setConsultorioId("");
    setMotivo("");
    setPrioridade("Normal");
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
        motivo: motivo || undefined,
        prioridade,
        origem: "rececao",
      });
      const paciente = pacientes.find((item) => item.id === Number(pacienteId));
      const especialidade = especialidades.find((item) => item.id === Number(especialidadeId));
      setUltimaFicha({
        senha: atendimento.senha,
        paciente: paciente?.nome || "Paciente",
        especialidade: especialidade?.nome || "Atendimento clinico",
        prioridade,
      });
      toast.success("Consulta iniciada com sucesso");
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
        pedidosExame: pedidosExame.map((pedido) => ({ tipoExameId: Number(pedido.tipoExameId), prioridade: pedido.prioridade, justificativa: pedido.justificativa })),
        medicamentos: medicamentos.map((medicamento) => ({ ...medicamento, duracaoDias: medicamento.duracaoDias ? Number(medicamento.duracaoDias) : undefined })),
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Consultas</h1>
          <p className="text-sm text-muted-foreground">
            Atendimentos de consulta — fila e atendimento
          </p>
        </div>
        {pode("atendimento", "criar") && (
          <Button onClick={() => setCriarOpen(true)}>
            <UserPlus className="h-4 w-4" /> Nova Consulta
          </Button>
        )}
      </div>

      {ultimaFicha && (
        <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-semibold">Consulta registada — senha {ultimaFicha.senha}</p><p className="text-sm text-muted-foreground">Ficha pronta para entregar ao paciente.</p></div>
          <Button variant="outline" onClick={() => imprimirFicha(ultimaFicha)}><Printer className="h-4 w-4" /> Imprimir ficha</Button>
        </div>
      )}

      {/* Lista */}
      {atendimentos.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Stethoscope className="h-8 w-8 text-muted-foreground" />}
            title="Sem consultas"
            description="Inicie uma nova consulta para começar a atender."
            action={
              pode("atendimento", "criar") && (
                <Button onClick={() => setCriarOpen(true)}>
                  <UserPlus className="h-4 w-4" /> Nova Consulta
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Consultas recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Código</th>
                    <th className="px-4 py-3 font-medium">Paciente</th>
                    <th className="px-4 py-3 font-medium">Especialidade</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Prioridade</th>
                    <th className="px-4 py-3 font-medium">Médico</th>
                    <th className="px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {atendimentos.map((a) => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium">{a.codigo}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{a.paciente.nome}</div>
                        {a.paciente.numeroProcesso && (
                          <div className="text-xs text-muted-foreground">{a.paciente.numeroProcesso}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">{a.especialidade?.nome || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={(ESTADO_COR[a.estado] as never) || "secondary"}>
                          {ESTADO_LABEL[a.estado] || a.estado}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={a.prioridade === "Urgente" ? "destructive" : a.prioridade === "Prioridade" ? "warning" : "secondary"}>
                          {a.prioridade}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{a.consulta?.medico?.nome || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => imprimirFicha({ senha: a.senha?.codigo || a.codigo, paciente: a.paciente.nome, especialidade: a.especialidade?.nome || "Atendimento clinico", prioridade: a.prioridade })} title="Imprimir ficha">
                          <Printer className="h-4 w-4" />
                        </Button>
                        {a.estado === "EM_ATENDIMENTO" && pode("atendimento", "editar") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setConcluirOpen(a);
                              resetConcluir();
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4" /> Concluir
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

      {/* Modal Nova Consulta */}
      <Modal
        open={criarOpen}
        onClose={() => setCriarOpen(false)}
        title="Nova Consulta"
        description="Iniciar um novo atendimento de consulta"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Paciente *</label>
            <Select
              options={pacientes.map((p) => ({
                value: p.id,
                label: `${p.nome}${p.numeroProcesso ? ` (${p.numeroProcesso})` : ""}`,
              }))}
              placeholder="Selecione o paciente"
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Especialidade</label>
            <Select
              options={especialidades.map((e) => ({ value: e.id, label: e.nome }))}
              placeholder="Selecione a especialidade"
              value={especialidadeId}
              onChange={(e) => setEspecialidadeId(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Consultório</label>
            <Select
              options={consultórios.map((c) => ({
                value: c.id,
                label: `${c.numero} - ${c.nome}`,
              }))}
              placeholder={
                carregandoConsultórios
                  ? "A carregar consultórios..."
                  : especialidadeId
                  ? "Selecione um consultório"
                  : "Selecione uma especialidade primeiro"
              }
              value={consultorioId}
              onChange={(e) => setConsultorioId(e.target.value)}
              disabled={!especialidadeId || carregandoConsultórios}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Prioridade</label>
            <Select
              options={[
                { value: "Normal", label: "Normal" },
                { value: "Prioridade", label: "Prioridade" },
                { value: "Urgente", label: "Urgente" },
              ]}
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Motivo</label>
            <textarea
              className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Motivo da consulta"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCriarOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleCriar} disabled={submitting}>
              {submitting ? "A criar..." : "Iniciar Consulta"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Concluir Consulta */}
      <Modal
        open={!!concluirOpen}
        onClose={() => setConcluirOpen(null)}
        title={concluirOpen ? `Concluir — ${concluirOpen.codigo}` : ""}
        description={concluirOpen ? `Paciente: ${concluirOpen.paciente.nome}` : ""}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Sinais e Sintomas</label>
            <textarea
              className="min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={sinaisSintomas}
              onChange={(e) => setSinaisSintomas(e.target.value)}
              placeholder="Sinais e sintomas"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Diagnóstico</label>
            <textarea
              className="min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              placeholder="Diagnóstico"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Prescrição</label>
            <textarea
              className="min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={prescricao}
              onChange={(e) => setPrescricao(e.target.value)}
              placeholder="Prescrição / medicação"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Observações</label>
            <textarea
              className="min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Encaminhar para</label>
              <input
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={encDestino}
                onChange={(e) => setEncDestino(e.target.value)}
                placeholder="Especialidade / setor (opcional)"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Motivo do encaminhamento</label>
              <input
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={encMotivo}
                onChange={(e) => setEncMotivo(e.target.value)}
                placeholder="Motivo (opcional)"
              />
            </div>
          </div>
          <PedidosEReceita
            tiposExame={tiposExame}
            pedidos={pedidosExame}
            medicamentos={medicamentos}
            observacoes={observacoesReceita}
            onPedidosChange={setPedidosExame}
            onMedicamentosChange={setMedicamentos}
            onObservacoesChange={setObservacoesReceita}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConcluirOpen(null)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleConcluir} disabled={submitting}>
              {submitting ? "A concluir..." : "Concluir Consulta"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
