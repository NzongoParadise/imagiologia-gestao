"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, CheckCircle2, Stethoscope, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { usePermissoes } from "@/hooks/use-permissoes";
import { PedidosEReceita, type MedicamentoFormulario, type PedidoFormulario } from "@/features/atendimento/components/pedidos-e-receita";
import {
  iniciarUrgencia,
  registarTriagem,
  concluirUrgencia,
  registarPedidosEReceita,
} from "@/server/actions/atendimento-actions";

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
  descricao: string | null;
  ativo: boolean;
}

interface Paciente {
  id: number;
  nome: string;
  numeroProcesso: string | null;
}

interface UrgenciaAtendimento {
  id: number;
  codigo: string;
  estado: string;
  prioridade: string;
  criadoEm: string;
  paciente: { id: number; nome: string; numeroProcesso: string | null };
  urgencia: {
    bancoUrgencia: { id: number; nome: string; tipo: string } | null;
    classificacao: { id: number; nome: string; cor: string; nivel: number } | null;
    medico: { id: number; nome: string } | null;
    queixaPrincipal: string | null;
  } | null;
  triagem: {
    classificacao: { id: number; nome: string; cor: string; nivel: number } | null;
  } | null;
}

interface UrgenciasClientProps {
  bancosUrgencia: BancoUrgencia[];
  classificacoesRisco: ClassificacaoRisco[];
  pacientes: Paciente[];
  tiposExame: { id: number; nome: string; modalidade: string | null }[];
  atendimentos: UrgenciaAtendimento[];
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

const COR_CLASSE: Record<string, string> = {
  vermelho: "bg-red-500",
  laranja: "bg-orange-500",
  amarelo: "bg-yellow-500",
  verde: "bg-green-500",
  azul: "bg-blue-500",
};

export function UrgenciasClient({
  bancosUrgencia,
  classificacoesRisco,
  pacientes,
  tiposExame,
  atendimentos,
}: UrgenciasClientProps) {
  const router = useRouter();
  const { pode } = usePermissoes();
  const [criarOpen, setCriarOpen] = useState(false);
  const [triagemOpen, setTriagemOpen] = useState<UrgenciaAtendimento | null>(null);
  const [concluirOpen, setConcluirOpen] = useState<UrgenciaAtendimento | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form criar
  const [pacienteId, setPacienteId] = useState("");
  const [bancoUrgenciaId, setBancoUrgenciaId] = useState("");
  const [queixaPrincipal, setQueixaPrincipal] = useState("");

  // Form triagem
  const [classificacaoId, setClassificacaoId] = useState("");
  const [sintomas, setSintomas] = useState("");
  const [alergias, setAlergias] = useState("");
  const [medicacao, setMedicacao] = useState("");
  const [ta, setTa] = useState("");
  const [fc, setFc] = useState("");
  const [fr, setFr] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [saturacao, setSaturacao] = useState("");

  // Form concluir
  const [diagnostico, setDiagnostico] = useState("");
  const [conduta, setConduta] = useState("");
  const [evolucao, setEvolucao] = useState("");
  const [altaTipo, setAltaTipo] = useState("alta");
  const [altaJustificativa, setAltaJustificativa] = useState("");
  const [pedidosExame, setPedidosExame] = useState<PedidoFormulario[]>([]);
  const [medicamentos, setMedicamentos] = useState<MedicamentoFormulario[]>([]);
  const [observacoesReceita, setObservacoesReceita] = useState("");

  const resetCriar = () => {
    setPacienteId("");
    setBancoUrgenciaId("");
    setQueixaPrincipal("");
  };

  const resetTriagem = () => {
    setClassificacaoId("");
    setSintomas("");
    setAlergias("");
    setMedicacao("");
    setTa("");
    setFc("");
    setFr("");
    setTemperatura("");
    setSaturacao("");
  };

  const resetConcluir = () => {
    setDiagnostico("");
    setConduta("");
    setEvolucao("");
    setAltaTipo("alta");
    setAltaJustificativa("");
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
      await iniciarUrgencia({
        pacienteId: Number(pacienteId),
        bancoUrgenciaId: bancoUrgenciaId ? Number(bancoUrgenciaId) : undefined,
        queixaPrincipal: queixaPrincipal || undefined,
        origem: "rececao",
      });
      toast.success("Urgência iniciada com sucesso");
      setCriarOpen(false);
      resetCriar();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao iniciar urgência");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriagem = async () => {
    if (!triagemOpen) return;
    if (!classificacaoId) {
      toast.error("Selecione a classificação de risco");
      return;
    }
    setSubmitting(true);
    try {
      const sinaisVitais: Record<string, string | number> = {};
      if (ta) sinaisVitais.ta = ta;
      if (fc) sinaisVitais.fc = Number(fc);
      if (fr) sinaisVitais.fr = Number(fr);
      if (temperatura) sinaisVitais.temperatura = Number(temperatura);
      if (saturacao) sinaisVitais.saturacao = Number(saturacao);

      await registarTriagem({
        atendimentoId: triagemOpen.id,
        classificacaoId: Number(classificacaoId),
        sinaisVitais,
        sintomas: sintomas || undefined,
        alergias: alergias || undefined,
        medicacao: medicacao || undefined,
      });
      toast.success("Triagem registada com sucesso");
      setTriagemOpen(null);
      resetTriagem();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao registar triagem");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConcluir = async () => {
    if (!concluirOpen) return;
    setSubmitting(true);
    try {
      await concluirUrgencia({
        atendimentoId: concluirOpen.id,
        diagnostico: diagnostico || undefined,
        conduta: conduta || undefined,
        evolucao: evolucao || undefined,
        altaTipo: altaTipo || undefined,
        altaJustificativa: altaJustificativa || undefined,
      });
      await registarPedidosEReceita({
        atendimentoId: concluirOpen.id,
        pedidosExame: pedidosExame.map((pedido) => ({ tipoExameId: Number(pedido.tipoExameId), prioridade: pedido.prioridade, justificativa: pedido.justificativa })),
        medicamentos: medicamentos.map((medicamento) => ({ ...medicamento, duracaoDias: medicamento.duracaoDias ? Number(medicamento.duracaoDias) : undefined })),
        observacoesReceita,
      });
      toast.success("Urgência concluída com sucesso");
      setConcluirOpen(null);
      resetConcluir();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao concluir urgência");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Urgências</h1>
          <p className="text-sm text-muted-foreground">
            Urgências, triagem e classificação de risco
          </p>
        </div>
        {pode("atendimento", "criar") && (
          <Button variant="destructive" onClick={() => setCriarOpen(true)}>
            <UserPlus className="h-4 w-4" /> Nova Urgência
          </Button>
        )}
      </div>

      {/* Fila de urgências em destaque */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {bancosUrgencia.map((b) => (
          <Card key={b.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{b.nome}</p>
                  <p className="text-xs text-muted-foreground">{b.tipo}</p>
                </div>
                <Badge variant="outline">
                  {atendimentos.filter((a) => a.urgencia?.bancoUrgencia?.id === b.id).length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista */}
      {atendimentos.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Stethoscope className="h-8 w-8 text-muted-foreground" />}
            title="Sem urgências"
            description="Inicie uma nova urgência para começar."
            action={
              pode("atendimento", "criar") && (
                <Button variant="destructive" onClick={() => setCriarOpen(true)}>
                  <UserPlus className="h-4 w-4" /> Nova Urgência
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Urgências recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Código</th>
                    <th className="px-4 py-3 font-medium">Paciente</th>
                    <th className="px-4 py-3 font-medium">Banco</th>
                    <th className="px-4 py-3 font-medium">Triagem</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
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
                      <td className="px-4 py-3">{a.urgencia?.bancoUrgencia?.nome || "—"}</td>
                      <td className="px-4 py-3">
                        {a.triagem?.classificacao ? (
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${COR_CLASSE[a.triagem.classificacao.cor] || "bg-gray-400"}`} />
                            <span>{a.triagem.classificacao.nome}</span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={(ESTADO_COR[a.estado] as never) || "secondary"}>
                          {ESTADO_LABEL[a.estado] || a.estado}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {a.estado === "AGUARDANDO" && pode("atendimento", "editar") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setTriagemOpen(a);
                                resetTriagem();
                              }}
                            >
                              <ClipboardList className="h-4 w-4" /> Triagem
                            </Button>
                          )}
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Nova Urgência */}
      <Modal
        open={criarOpen}
        onClose={() => setCriarOpen(false)}
        title="Nova Urgência"
        description="Iniciar um novo atendimento de urgência"
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
            <label className="mb-1 block text-sm font-medium">Banco de Urgência</label>
            <Select
              options={bancosUrgencia.map((b) => ({ value: b.id, label: `${b.nome} (${b.tipo})` }))}
              placeholder="Selecione o banco de urgência"
              value={bancoUrgenciaId}
              onChange={(e) => setBancoUrgenciaId(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Queixa principal</label>
            <textarea
              className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={queixaPrincipal}
              onChange={(e) => setQueixaPrincipal(e.target.value)}
              placeholder="Queixa principal"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCriarOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleCriar} disabled={submitting}>
              {submitting ? "A criar..." : "Iniciar Urgência"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Triagem */}
      <Modal
        open={!!triagemOpen}
        onClose={() => setTriagemOpen(null)}
        title={triagemOpen ? `Triagem — ${triagemOpen.codigo}` : ""}
        description={triagemOpen ? `Paciente: ${triagemOpen.paciente.nome}` : ""}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Classificação de Risco *</label>
            <Select
              options={classificacoesRisco.map((c) => ({
                value: c.id,
                label: `${c.nome}${c.descricao ? ` — ${c.descricao}` : ""}`,
              }))}
              placeholder="Selecione a classificação"
              value={classificacaoId}
              onChange={(e) => setClassificacaoId(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">TA (mmHg)</label>
              <input
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={ta}
                onChange={(e) => setTa(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">FC (bpm)</label>
              <input
                type="number"
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={fc}
                onChange={(e) => setFc(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">FR (cpm)</label>
              <input
                type="number"
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={fr}
                onChange={(e) => setFr(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Temperatura (°C)</label>
              <input
                type="number"
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={temperatura}
                onChange={(e) => setTemperatura(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">SpO₂ (%)</label>
              <input
                type="number"
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={saturacao}
                onChange={(e) => setSaturacao(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Sintomas</label>
            <textarea
              className="min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={sintomas}
              onChange={(e) => setSintomas(e.target.value)}
              placeholder="Sintomas"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Alergias</label>
              <input
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={alergias}
                onChange={(e) => setAlergias(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Medicação</label>
              <input
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={medicacao}
                onChange={(e) => setMedicacao(e.target.value)}
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
            <Button variant="outline" onClick={() => setTriagemOpen(null)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleTriagem} disabled={submitting}>
              {submitting ? "A registar..." : "Registar Triagem"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Concluir Urgência */}
      <Modal
        open={!!concluirOpen}
        onClose={() => setConcluirOpen(null)}
        title={concluirOpen ? `Concluir Urgência — ${concluirOpen.codigo}` : ""}
        description={concluirOpen ? `Paciente: ${concluirOpen.paciente.nome}` : ""}
        size="lg"
      >
        <div className="space-y-4">
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
            <label className="mb-1 block text-sm font-medium">Conduta</label>
            <textarea
              className="min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={conduta}
              onChange={(e) => setConduta(e.target.value)}
              placeholder="Conduta"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Evolução</label>
            <textarea
              className="min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={evolucao}
              onChange={(e) => setEvolucao(e.target.value)}
              placeholder="Evolução"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Tipo de Alta</label>
              <Select
                options={[
                  { value: "alta", label: "Alta" },
                  { value: "internamento", label: "Internamento" },
                  { value: "transferencia", label: "Transferência" },
                  { value: "observacao", label: "Observação" },
                ]}
                value={altaTipo}
                onChange={(e) => setAltaTipo(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Justificativa</label>
              <input
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={altaJustificativa}
                onChange={(e) => setAltaJustificativa(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConcluirOpen(null)} disabled={submitting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConcluir} disabled={submitting}>
              {submitting ? "A concluir..." : "Concluir Urgência"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
