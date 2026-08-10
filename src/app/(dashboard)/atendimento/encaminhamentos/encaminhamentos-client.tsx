"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRightLeft, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { usePermissoes } from "@/hooks/use-permissoes";
import { atualizarEstadoEncaminhamento } from "@/server/actions/atendimento-actions";

interface Encaminhamento {
  id: number;
  atendimentoId: number;
  pacienteId: number;
  origemTipo: string;
  destino: string;
  tipoDestino: string | null;
  motivo: string;
  prioridade: string;
  estado: string;
  criadoEm: string;
  paciente: { id: number; nome: string; numeroProcesso: string | null };
  atendimento: { id: number; codigo: string; tipo: string };
  criadoPor: { id: number; nome: string } | null;
}

interface EncaminhamentosClientProps {
  encaminhamentos: Encaminhamento[];
}

const ESTADO_COR: Record<string, string> = {
  PENDENTE: "warning",
  AGUARDANDO: "info",
  ACEITE: "default",
  CONCLUIDO: "success",
  RECUSADO: "destructive",
  CANCELADO: "destructive",
};

const ESTADO_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  AGUARDANDO: "Aguardando",
  ACEITE: "Aceite",
  CONCLUIDO: "Concluído",
  RECUSADO: "Recusado",
  CANCELADO: "Cancelado",
};

export function EncaminhamentosClient({
  encaminhamentos,
}: EncaminhamentosClientProps) {
  const router = useRouter();
  const { pode } = usePermissoes();
  const [submitting, setSubmitting] = useState<number | null>(null);

  const handleEstado = async (id: number, estado: string) => {
    setSubmitting(id);
    try {
      await atualizarEstadoEncaminhamento(id, estado);
      toast.success(`Encaminhamento ${ESTADO_LABEL[estado] || estado}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar encaminhamento");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Encaminhamentos</h1>
          <p className="text-sm text-muted-foreground">
            Gerir encaminhamentos de pacientes
          </p>
        </div>
      </div>

      {encaminhamentos.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ArrowRightLeft className="h-8 w-8 text-muted-foreground" />}
            title="Sem encaminhamentos"
            description="Os encaminhamentos criados nas consultas/urgências aparecerão aqui."
          />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Encaminhamentos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Paciente</th>
                    <th className="px-4 py-3 font-medium">Atendimento</th>
                    <th className="px-4 py-3 font-medium">Destino</th>
                    <th className="px-4 py-3 font-medium">Motivo</th>
                    <th className="px-4 py-3 font-medium">Prioridade</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {encaminhamentos.map((e) => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <div className="font-medium">{e.paciente.nome}</div>
                        {e.paciente.numeroProcesso && (
                          <div className="text-xs text-muted-foreground">{e.paciente.numeroProcesso}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{e.atendimento.codigo}</span>
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({e.atendimento.tipo})
                        </span>
                      </td>
                      <td className="px-4 py-3">{e.destino}</td>
                      <td className="px-4 py-3 max-w-[220px] truncate" title={e.motivo}>
                        {e.motivo}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={e.prioridade === "Urgente" ? "destructive" : e.prioridade === "Prioridade" ? "warning" : "secondary"}>
                          {e.prioridade}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={(ESTADO_COR[e.estado] as never) || "secondary"}>
                          {ESTADO_LABEL[e.estado] || e.estado}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {e.estado === "PENDENTE" && pode("atendimento", "editar") && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEstado(e.id, "ACEITE")}
                                disabled={submitting === e.id}
                              >
                                <CheckCircle2 className="h-4 w-4" /> Aceitar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleEstado(e.id, "RECUSADO")}
                                disabled={submitting === e.id}
                              >
                                <XCircle className="h-4 w-4" /> Recusar
                              </Button>
                            </>
                          )}
                          {e.estado === "ACEITE" && pode("atendimento", "editar") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEstado(e.id, "CONCLUIDO")}
                              disabled={submitting === e.id}
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
    </div>
  );
}
