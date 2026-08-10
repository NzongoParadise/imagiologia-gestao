"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BarChart3, Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { obterRelatorioAtendimento } from "@/server/actions/atendimento-actions";

interface PorEstado {
  estado: string;
  _count: number;
}

interface PorEspecialidade {
  especialidadeId: number | null;
  _count: number;
}

interface PorBanco {
  bancoUrgenciaId: number | null;
  _count: number;
}

interface Relatorio {
  periodo: { inicio: string; fim: string };
  total: number;
  consultas: number;
  urgencias: number;
  porEstado: PorEstado[];
  porEspecialidade: PorEspecialidade[];
  porBanco: PorBanco[];
  porDia: Record<string, { total: number; consultas: number; urgencias: number }>;
}

const ESTADO_LABEL: Record<string, string> = {
  AGUARDANDO: "Aguardando",
  EM_TRIAGEM: "Em triagem",
  EM_ATENDIMENTO: "Em atendimento",
  CONCLUIDO: "Concluído",
  ENCAMINHADO: "Encaminhado",
  CANCELADO: "Cancelado",
};

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function mesAtras() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}

export function RelatoriosClient() {
  const [inicio, setInicio] = useState(mesAtras());
  const [fim, setFim] = useState(hoje());
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [loading, setLoading] = useState(false);

  const gerar = async () => {
    if (!inicio || !fim) {
      toast.error("Selecione o período");
      return;
    }
    setLoading(true);
    try {
      const res = await obterRelatorioAtendimento(inicio, fim);
      setRelatorio(res as unknown as Relatorio);
      toast.success("Relatório gerado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  };

  const exportarCSV = () => {
    if (!relatorio) return;
const linhas: string[][] = [
      ["Indicador", "Valor"],
      ["Total", String(relatorio.total)],
      ["Consultas", String(relatorio.consultas)],
      ["Urgências", String(relatorio.urgencias)],
      ["", ""],
      ["Dia", "Total", "Consultas", "Urgências"],
    ];
    Object.entries(relatorio.porDia || {}).forEach(([dia, v]) => {
      linhas.push([dia, String(v.total), String(v.consultas), String(v.urgencias)]);
    });
    const csv = linhas.map((l) => l.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-atendimento-${inicio}-${fim}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios de Atendimento</h1>
          <p className="text-sm text-muted-foreground">
            Relatórios de consultas e urgências por período
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div>
              <label className="mb-1 block text-sm font-medium">Início</label>
              <input
                type="date"
                className="rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Fim</label>
              <input
                type="date"
                className="rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
              />
            </div>
            <Button onClick={gerar} disabled={loading}>
              <BarChart3 className="h-4 w-4" />
              {loading ? "A gerar..." : "Gerar relatório"}
            </Button>
            {relatorio && (
              <Button variant="outline" onClick={exportarCSV}>
                <Download className="h-4 w-4" /> Exportar CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {!relatorio ? (
        <Card>
          <EmptyState
            icon={<FileText className="h-8 w-8 text-muted-foreground" />}
            title="Sem relatório"
            description="Selecione um período e clique em Gerar relatório."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{relatorio.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Consultas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-500">{relatorio.consultas}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Urgências</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-500">{relatorio.urgencias}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Por estado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatorio.porEstado && relatorio.porEstado.length > 0 ? (
                  relatorio.porEstado.map((p) => (
                    <div key={p.estado} className="flex items-center justify-between">
                      <span className="text-sm">{ESTADO_LABEL[p.estado] || p.estado}</span>
                      <Badge variant="outline">{p._count}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Sem dados</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Por dia</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(relatorio.porDia || {}).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(relatorio.porDia).map(([dia, v]) => (
                      <div key={dia} className="flex items-center justify-between border-b pb-2 text-sm">
                        <span>{dia}</span>
                        <span className="text-muted-foreground">
                          {v.total} (C:{v.consultas} · U:{v.urgencias})
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem dados</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
