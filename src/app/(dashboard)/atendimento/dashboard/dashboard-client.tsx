"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Activity,
  Clock,
  Plus,
  Stethoscope,
  Timer,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { obterDashboardAtendimento } from "@/server/actions/atendimento-actions";

interface PorEstado {
  estado: string;
  _count: number;
}

interface PorBanco {
  bancoUrgenciaId: number | null;
  _count: number;
}

interface DashboardAtendimento {
  data: string;
  total: number;
  consultas: number;
  urgencias: number;
  aguardando: number;
  emAtendimento: number;
  concluidos: number;
  porEstado: PorEstado[];
  porBanco: PorBanco[];
  tempoMedioEsperaMin: number;
}

interface DashboardClientProps {
  dashboard: DashboardAtendimento;
}

const ESTADO_LABEL: Record<string, string> = {
  AGUARDANDO: "Aguardando",
  EM_TRIAGEM: "Em triagem",
  EM_ATENDIMENTO: "Em atendimento",
  CONCLUIDO: "Concluído",
  ENCAMINHADO: "Encaminhado",
  CANCELADO: "Cancelado",
};

export function DashboardClient({ dashboard }: DashboardClientProps) {
  const router = useRouter();
  const [data, setData] = useState(dashboard.data);
  const [loading, setLoading] = useState(false);

  const mudarData = async (novaData: string) => {
    setData(novaData);
    setLoading(true);
    try {
      const res = await obterDashboardAtendimento(novaData);
      // refresh server component com a nova data
      router.refresh();
      toast.success("Dados atualizados");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      label: "Total de atendimentos",
      valor: dashboard.total,
      icon: Activity,
      classe: "text-primary",
    },
    {
      label: "Consultas",
      valor: dashboard.consultas,
      icon: Stethoscope,
      classe: "text-blue-500",
    },
    {
      label: "Urgências",
      valor: dashboard.urgencias,
      icon: AlertTriangle,
      classe: "text-orange-500",
    },
    {
      label: "A aguardar",
      valor: dashboard.aguardando,
      icon: Clock,
      classe: "text-yellow-500",
    },
    {
      label: "Em atendimento",
      valor: dashboard.emAtendimento,
      icon: Activity,
      classe: "text-green-500",
    },
    {
      label: "Concluídos",
      valor: dashboard.concluidos,
      icon: CheckCircle2,
      classe: "text-emerald-500",
    },
    {
      label: "Tempo médio de espera",
      valor: `${dashboard.tempoMedioEsperaMin} min`,
      icon: Timer,
      classe: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Atendimento</h1>
          <p className="text-sm text-muted-foreground">
            Indicadores de consultas e urgências
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={data}
            onChange={(e) => mudarData(e.target.value)}
            disabled={loading}
          />
          <Button size="sm" onClick={() => router.push("/atendimento/consultas")}>
            <Plus className="h-4 w-4" /> Novo atendimento
          </Button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className="text-2xl font-bold">{c.valor}</p>
                  </div>
                  <Icon className={`h-6 w-6 ${c.classe}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Por estado */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Atendimentos por estado</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.porEstado && dashboard.porEstado.length > 0 ? (
              <div className="space-y-3">
                {dashboard.porEstado.map((p) => (
                  <div key={p.estado} className="flex items-center justify-between">
                    <span className="text-sm">{ESTADO_LABEL[p.estado] || p.estado}</span>
                    <Badge variant="outline">{p._count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Activity className="h-6 w-6 text-muted-foreground" />}
                title="Sem dados"
                description="Sem atendimentos no dia selecionado."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Próximas ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Consultas</p>
                <p className="text-xs text-muted-foreground">
                  {dashboard.aguardando} a aguardar
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => router.push("/atendimento/consultas")}>
                Gerir
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Urgências</p>
                <p className="text-xs text-muted-foreground">
                  {dashboard.urgencias} hoje
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => router.push("/atendimento/urgencias")}>
                Gerir
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Encaminhamentos</p>
                <p className="text-xs text-muted-foreground">Gerir encaminhamentos</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => router.push("/atendimento/encaminhamentos")}>
                Gerir
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
