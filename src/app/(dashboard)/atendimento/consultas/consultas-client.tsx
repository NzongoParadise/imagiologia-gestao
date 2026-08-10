"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, PhoneCall, CheckCircle2, ArrowRightLeft, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { usePermissoes } from "@/hooks/use-permissoes";
import {
  iniciarConsulta,
  concluirConsulta,
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

interface ConsultaAtendimento {
  id: number;
  codigo: string;
  estado: string;
  prioridade: string;
  criadoEm: string;
  paciente: { id: number; nome: string; numeroProcesso: string | null };
  especialidade: { id: number; nome: string } | null;
  consulta: {
    medico: { id: number; nome: string } | null;
    diagnostico: string | null;
    concluidoEm: string | null;
  } | null;
  criadoPor: { id: number; nome: string } | null;
}

interface ConsultasClientProps {
  especialidades: Especialidade[];
  pacientes: Paciente[];
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
  atendimentos,
}: ConsultasClientProps) {
  const router = useRouter();
  const { pode } = usePermissoes();
  const [criarOpen, setCriarOpen] = useState(false);
  const [concluirOpen, setConcluirOpen] = useState<ConsultaAtendimento | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form estado
  const [pacienteId, setPacienteId] = useState("");
  const [especialidadeId, setEspecialidadeId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [prioridade, setPrioridade] = useState("Normal");

  // Form concluir
  const [diagnostico, setDiagnostico] = useState("");
  const [sinaisSintomas, setSinaisSintomas] = useState("");
  const [prescricao, setPrescricao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [encDestino, setEncDestino] = useState("");
  const [encMotivo, setEncMotivo] = useState("");

  const resetCriar = () => {
    setPacienteId("");
    setEspecialidadeId("");
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
  };

  const handleCriar = async () => {
    if (!pacienteId) {
      toast.error("Selecione um paciente");
      return;
    }
    setSubmitting(true);
    try {
      await iniciarConsulta({
        pacienteId: Number(pacienteId),
        especialidadeId: especialidadeId ? Number(especialidadeId) : undefined,
        motivo: motivo || undefined,
        prioridade,
        origem: "rececao",
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
