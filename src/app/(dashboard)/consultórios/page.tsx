"use client";

import { useEffect, useState } from "react";
import { listarConsultorios } from "@/server/actions/consultorio-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

interface Consultorio {
  id: number;
  numero: string;
  nome: string;
  especialidade?: {
    nome: string;
  };
  ativo: boolean;
  atendimentos: any[];
  agendamentos: any[];
}

export default function ConsultoriosPage() {
  const [consultórios, setConsultórios] = useState<Consultorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    async function carregarConsultórios() {
      try {
        const dados = await listarConsultorios();
        setConsultórios(dados as Consultorio[]);
      } catch (error) {
        console.error("Erro ao carregar consultórios:", error);
      } finally {
        setLoading(false);
      }
    }

    carregarConsultórios();
  }, []);

  const consultoriofiltrados = consultórios.filter(
    (c) =>
      c.numero.toLowerCase().includes(busca.toLowerCase()) ||
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.especialidade?.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Consultórios</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os consultórios e suas consultas
          </p>
        </div>
        <Link href="/dashboard/consultórios/novo">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Consultório
          </Button>
        </Link>
      </div>

      {/* Barra de Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Buscar por número, nome ou especialidade..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grid de Consultórios */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Carregando consultórios...</p>
        </div>
      ) : consultoriofiltrados.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">Nenhum consultório encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {consultoriofiltrados.map((consultorio) => (
            <Link
              key={consultorio.id}
              href={`/dashboard/consultórios/${consultorio.id}`}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {consultorio.numero}
                      </CardTitle>
                      <CardDescription>{consultorio.nome}</CardDescription>
                    </div>
                    {consultorio.ativo ? (
                      <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Ativo
                      </div>
                    ) : (
                      <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        Inativo
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {consultorio.especialidade && (
                      <div>
                        <p className="text-xs text-gray-600">Especialidade</p>
                        <p className="font-medium">
                          {consultorio.especialidade.nome}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <div>
                        <p className="text-xs text-gray-600">Consultas Ativas</p>
                        <p className="text-lg font-bold">
                          {consultorio.atendimentos.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Agendadas</p>
                        <p className="text-lg font-bold">
                          {consultorio.agendamentos.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
