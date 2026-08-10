"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  descricao: string | null;
  ativo: boolean;
}

interface AtendimentoClientProps {
  estatisticas: Estatisticas;
  especialidades: Especialidade[];
  bancosUrgencia: BancoUrgencia[];
  classificacoesRisco: ClassificacaoRisco[];
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

export function AtendimentoClient({
  estatisticas,
  especialidades,
  bancosUrgencia,
  classificacoesRisco,
}: AtendimentoClientProps) {
  const router = useRouter();
  const { pode } = usePermissoes();

  const cartoes = [
    {
      titulo: "Total hoje",
      valor: estatisticas.totalHoje,
      icon: Activity,
      cor: "bg-blue-500/10 text-blue-600",
    },
    {
      titulo: "Consultas hoje",
      valor: estatisticas.consultasHoje,
      icon: Stethoscope,
      cor: "bg-emerald-500/10 text-emerald-600",
    },
    {
      titulo: "Urgências hoje",
      valor: estatisticas.urgenciasHoje,
      icon: AlertTriangle,
      cor: "bg-red-500/10 text-red-600",
    },
    {
      titulo: "A aguardar",
      valor: estatisticas.aguardando,
      icon: Users,
      cor: "bg-amber-500/10 text-amber-600",
    },
    {
      titulo: "Em atendimento",
      valor: estatisticas.emAtendimento,
      icon: Clock,
      cor: "bg-violet-500/10 text-violet-600",
    },
    {
      titulo: "Concluídos",
      valor: estatisticas.concluidos,
      icon: CheckCircle2,
      cor: "bg-green-500/10 text-green-600",
    },
    {
      titulo: "Encaminham. pendentes",
      valor: estatisticas.encaminhamentosPendentes,
      icon: ArrowRightLeft,
      cor: "bg-orange-500/10 text-orange-600",
    },
  ];

  const modulos = [
    {
      href: "/atendimento/consultas",
      titulo: "Consultas",
      descricao: "Iniciar e gerir consultas",
      icon: Stethoscope,
      cor: "bg-emerald-500/10 text-emerald-600",
    },
    {
      href: "/atendimento/urgencias",
      titulo: "Urgências",
      descricao: "Urgências e classificação de risco",
      icon: AlertTriangle,
      cor: "bg-red-500/10 text-red-600",
    },
    {
      href: "/atendimento/encaminhamentos",
      titulo: "Encaminhamentos",
      descricao: "Gerir encaminhamentos",
      icon: ArrowRightLeft,
      cor: "bg-orange-500/10 text-orange-600",
    },
    {
      href: "/atendimento/dashboard",
      titulo: "Dashboard",
      descricao: "Indicadores do atendimento",
      icon: TrendingUp,
      cor: "bg-blue-500/10 text-blue-600",
    },
    {
      href: "/atendimento/relatorios",
      titulo: "Relatórios",
      descricao: "Relatórios de atendimento",
      icon: ClipboardList,
      cor: "bg-violet-500/10 text-violet-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Atendimento</h1>
          <p className="text-sm text-muted-foreground">
            Consultas, urgências, triagem e encaminhamentos
          </p>
        </div>
        {(pode("atendimento", "criar")) && (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/atendimento/consultas"
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              <UserPlus className="h-4 w-4" /> Nova Consulta
            </Link>
            <Link
              href="/atendimento/urgencias"
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              <Phone className="h-4 w-4" /> Nova Urgência
            </Link>
          </div>
        )}
      </div>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cartoes.map((c) => (
          <Card key={c.titulo}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${c.cor}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{c.valor}</p>
                <p className="text-xs text-muted-foreground">{c.titulo}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Módulos */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Módulos</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {modulos.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="rounded-xl border bg-card p-5 hover:shadow-md hover:border-primary/40 transition-all group"
              >
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${m.cor}`}>
                  <m.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">{m.titulo}</h3>
                <p className="text-sm text-muted-foreground">{m.descricao}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Estado atual */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Estado atual</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Atendimentos por estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {estatisticas.porEstado.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados</p>
              ) : (
                estatisticas.porEstado.map((e) => (
                  <div key={e.estado} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={(ESTADO_COR[e.estado] as never) || "secondary"}>
                        {ESTADO_LABEL[e.estado] || e.estado}
                      </Badge>
                    </div>
                    <span className="font-semibold">{e._count}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Especialidades ativas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {especialidades.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma especialidade</p>
              ) : (
                especialidades.slice(0, 6).map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <span>{e.nome}</span>
                    <Badge variant="secondary">Ativa</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
