"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  obterConsultorioComConsultas,
  obterEstatisticasConsultorio,
} from "@/server/actions/consultorio-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Clock, Users, Calendar } from "lucide-react";
import HorarioConsultorioComponent from "@/components/consultorio/horario-consultorio";

interface Consultorio {
  id: number;
  numero: string;
  nome: string;
  andar?: string;
  bloco?: string;
  capacidade: number;
  equipamentos?: string;
  ativo: boolean;
  especialidade?: {
    id: number;
    nome: string;
  };
  criadoPor?: {
    nome: string;
  };
  atendimentos: any[];
  agendamentos: any[];
}

interface Estatisticas {
  consultasHoje: number;
  consultasAtivasAgora: number;
  agendamentosProximos: number;
}

export default function DetalhesConsultorioPage() {
  const params = useParams();
  const consultorioId = parseInt(params.id as string);

  const [consultorio, setConsultorio] = useState<Consultorio | null>(null);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<"ativas" | "agendadas" | "historico" | "horarios">("ativas");

  useEffect(() => {
    async function carregarDados() {
      try {
        const [consultorioData, estatisticasData] = await Promise.all([
          obterConsultorioComConsultas(consultorioId),
          obterEstatisticasConsultorio(consultorioId),
        ]);
        setConsultorio(consultorioData as unknown as Consultorio);
        setEstatisticas(estatisticasData as Estatisticas);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [consultorioId]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Carregando consultório...</p>
      </div>
    );
  }

  if (!consultorio) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Consultório não encontrado</p>
      </div>
    );
  }

  // Filtrar consultas ativas
  const consultasAtivasAgora = consultorio.atendimentos.filter(
    (a) =>
      a.tipo === "CONSULTA" &&
      ["AGUARDANDO", "EM_TRIAGEM", "EM_ATENDIMENTO"].includes(a.estado)
  );

  // Filtrar consultas concluídas
  const consultasConcluidasHoje = consultorio.atendimentos.filter(
    (a) =>
      a.tipo === "CONSULTA" &&
      a.estado === "CONCLUIDO" &&
      new Date(a.criadoEm).toDateString() === new Date().toDateString()
  );

  // Filtrar agendamentos próximos
  const agendamentosProximos = consultorio.agendamentos.filter(
    (a) => new Date(a.dataHora) > new Date()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/consultórios">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{consultorio.numero}</h1>
            <p className="text-gray-600">{consultorio.nome}</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex gap-2">
            {consultorio.especialidade && (
              <Badge variant="secondary">{consultorio.especialidade.nome}</Badge>
            )}
            {consultorio.ativo ? (
              <Badge variant="default" className="bg-green-600">
                Ativo
              </Badge>
            ) : (
              <Badge variant="destructive">Inativo</Badge>
            )}
          </div>
          <Link href={`/dashboard/consultórios/${consultorio.id}/editar`}>
            <Button variant="outline" size="sm">
              Editar
            </Button>
          </Link>
        </div>
      </div>

      {/* Informações do Consultório */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Consultório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {consultorio.bloco && (
              <div>
                <p className="text-sm text-gray-600">Bloco</p>
                <p className="font-medium">{consultorio.bloco}</p>
              </div>
            )}
            {consultorio.andar && (
              <div>
                <p className="text-sm text-gray-600">Andar</p>
                <p className="font-medium">{consultorio.andar}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Capacidade</p>
              <p className="font-medium">{consultorio.capacidade} pessoa(s)</p>
            </div>
            {consultorio.equipamentos && (
              <div className="lg:col-span-2">
                <p className="text-sm text-gray-600">Equipamentos</p>
                <p className="font-medium text-sm">{consultorio.equipamentos}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Consultas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {estatisticas.consultasAtivasAgora}
              </p>
              <p className="text-sm text-gray-600">agora</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{estatisticas.consultasHoje}</p>
              <p className="text-sm text-gray-600">consultas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Agendadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {estatisticas.agendamentosProximos}
              </p>
              <p className="text-sm text-gray-600">próximas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Abas de Consultas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestão de Consultas</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={aba === "ativas" ? "default" : "outline"}
                onClick={() => setAba("ativas")}
              >
                Ativas ({consultasAtivasAgora.length})
              </Button>
              <Button
                variant={aba === "agendadas" ? "default" : "outline"}
                onClick={() => setAba("agendadas")}
              >
                Agendadas ({agendamentosProximos.length})
              </Button>
              <Button
                variant={aba === "historico" ? "default" : "outline"}
                onClick={() => setAba("historico")}
              >
                Concluídas ({consultasConcluidasHoje.length})
              </Button>
              <Button
                variant={aba === "horarios" ? "default" : "outline"}
                onClick={() => setAba("horarios")}
              >
                Horários
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {aba === "ativas" && (
            <div className="space-y-3">
              {consultasAtivasAgora.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  Nenhuma consulta ativa no momento
                </p>
              ) : (
                consultasAtivasAgora.map((consulta) => (
                  <div
                    key={consulta.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {consulta.paciente.nome}
                        </p>
                        <p className="text-sm text-gray-600">
                          Código: {consulta.codigo}
                        </p>
                      </div>
                      <Badge
                        variant={
                          consulta.estado === "EM_ATENDIMENTO"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {consulta.estado === "EM_ATENDIMENTO"
                          ? "Em Atendimento"
                          : "Aguardando"}
                      </Badge>
                    </div>
                    {consulta.consulta?.medico && (
                      <p className="text-sm text-gray-600 mt-2">
                        Médico: {consulta.consulta.medico.nome}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {aba === "agendadas" && (
            <div className="space-y-3">
              {agendamentosProximos.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  Nenhum agendamento próximo
                </p>
              ) : (
                agendamentosProximos.map((agendamento) => (
                  <div
                    key={agendamento.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {agendamento.paciente.nome}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(agendamento.dataHora).toLocaleString(
                            "pt-PT"
                          )}
                        </p>
                      </div>
                      <Badge>{agendamento.estado}</Badge>
                    </div>
                    {agendamento.medico && (
                      <p className="text-sm text-gray-600 mt-2">
                        Médico: {agendamento.medico.nome}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {aba === "historico" && (
            <div className="space-y-3">
              {consultasConcluidasHoje.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  Nenhuma consulta concluída hoje
                </p>
              ) : (
                consultasConcluidasHoje.map((consulta) => (
                  <div
                    key={consulta.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {consulta.paciente.nome}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(consulta.criadoEm).toLocaleTimeString(
                            "pt-PT"
                          )}
                        </p>
                      </div>
                      <Badge variant="outline">Concluída</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {aba === "horarios" && (
            <HorarioConsultorioComponent consultorioId={consultorioId} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
