"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  obterConsultorioComConsultas,
  atualizarConsultorio,
} from "@/server/actions/consultorio-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface Consultorio {
  id: number;
  numero: string;
  nome: string;
  especialidadeId?: number;
  andar?: string;
  bloco?: string;
  capacidade: number;
  equipamentos?: string;
  ativo: boolean;
  especialidade?: {
    id: number;
    nome: string;
  };
}

interface Especialidade {
  id: number;
  nome: string;
}

export default function EditarConsultorioPage() {
  const params = useParams();
  const router = useRouter();
  const consultorioId = parseInt(params.id as string);

  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [consultorio, setConsultorio] = useState<Consultorio | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    numero: "",
    nome: "",
    especialidadeId: "",
    andar: "",
    bloco: "",
    capacidade: "1",
    equipamentos: "",
    ativo: true,
  });

  useEffect(() => {
    async function carregarDados() {
      try {
        const [consultorioData, especialidadesData] = await Promise.all([
          obterConsultorioComConsultas(consultorioId),
          fetch("/api/especialidades").then((r) => r.json()),
        ]);

        setConsultorio(consultorioData as Consultorio);
        setEspecialidades(especialidadesData);

        setForm({
          numero: consultorioData.numero,
          nome: consultorioData.nome,
          especialidadeId: consultorioData.especialidadeId?.toString() || "",
          andar: consultorioData.andar || "",
          bloco: consultorioData.bloco || "",
          capacidade: consultorioData.capacidade.toString(),
          equipamentos: consultorioData.equipamentos || "",
          ativo: consultorioData.ativo,
        });
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [consultorioId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErros({});
    setSalvando(true);

    try {
      const novosErros: Record<string, string> = {};

      if (!form.numero.trim()) {
        novosErros.numero = "Número do consultório é obrigatório";
      }
      if (!form.nome.trim()) {
        novosErros.nome = "Nome do consultório é obrigatório";
      }
      if (parseInt(form.capacidade) < 1) {
        novosErros.capacidade = "Capacidade deve ser no mínimo 1";
      }

      if (Object.keys(novosErros).length > 0) {
        setErros(novosErros);
        setSalvando(false);
        return;
      }

      await atualizarConsultorio(consultorioId, {
        numero: form.numero.trim(),
        nome: form.nome.trim(),
        especialidadeId: form.especialidadeId
          ? parseInt(form.especialidadeId)
          : null,
        andar: form.andar || undefined,
        bloco: form.bloco || undefined,
        capacidade: parseInt(form.capacidade),
        equipamentos: form.equipamentos || undefined,
        ativo: form.ativo,
      });

      router.push(`/dashboard/consultórios/${consultorioId}`);
    } catch (error) {
      console.error("Erro ao atualizar consultório:", error);
      setErros({
        submit:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar consultório",
      });
    } finally {
      setSalvando(false);
    }
  }

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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/consultórios/${consultorioId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Consultório</h1>
          <p className="text-gray-600">{consultorio.numero} - {consultorio.nome}</p>
        </div>
      </div>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Consultório</CardTitle>
          <CardDescription>Atualize os dados do consultório</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Número */}
              <div>
                <Label htmlFor="numero">Número do Consultório *</Label>
                <Input
                  id="numero"
                  placeholder="ex: Cons-01"
                  value={form.numero}
                  onChange={(e) =>
                    setForm({ ...form, numero: e.target.value })
                  }
                  className={erros.numero ? "border-red-500" : ""}
                />
                {erros.numero && (
                  <p className="text-red-500 text-sm mt-1">{erros.numero}</p>
                )}
              </div>

              {/* Nome */}
              <div>
                <Label htmlFor="nome">Nome do Consultório *</Label>
                <Input
                  id="nome"
                  placeholder="ex: Consultório de Cardiologia"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className={erros.nome ? "border-red-500" : ""}
                />
                {erros.nome && (
                  <p className="text-red-500 text-sm mt-1">{erros.nome}</p>
                )}
              </div>

              {/* Especialidade */}
              <div>
                <Label htmlFor="especialidade">Especialidade</Label>
                <Select
                  id="especialidade"
                  value={form.especialidadeId}
                  onChange={(event) =>
                    setForm({ ...form, especialidadeId: event.target.value })
                  }
                  placeholder="Nenhuma"
                  options={especialidades.map((esp) => ({
                    value: esp.id,
                    label: esp.nome,
                  }))}
                />
              </div>

              {/* Capacidade */}
              <div>
                <Label htmlFor="capacidade">Capacidade</Label>
                <Input
                  id="capacidade"
                  type="number"
                  min="1"
                  value={form.capacidade}
                  onChange={(e) =>
                    setForm({ ...form, capacidade: e.target.value })
                  }
                  className={erros.capacidade ? "border-red-500" : ""}
                />
                {erros.capacidade && (
                  <p className="text-red-500 text-sm mt-1">
                    {erros.capacidade}
                  </p>
                )}
              </div>

              {/* Bloco */}
              <div>
                <Label htmlFor="bloco">Bloco</Label>
                <Input
                  id="bloco"
                  placeholder="ex: Bloco A"
                  value={form.bloco}
                  onChange={(e) => setForm({ ...form, bloco: e.target.value })}
                />
              </div>

              {/* Andar */}
              <div>
                <Label htmlFor="andar">Andar</Label>
                <Input
                  id="andar"
                  placeholder="ex: 2º Andar"
                  value={form.andar}
                  onChange={(e) => setForm({ ...form, andar: e.target.value })}
                />
              </div>
            </div>

            {/* Equipamentos */}
            <div>
              <Label htmlFor="equipamentos">Equipamentos</Label>
              <Textarea
                id="equipamentos"
                placeholder="ex: Ecógrafo, Monitor, Estetoscópio"
                value={form.equipamentos}
                onChange={(e) =>
                  setForm({ ...form, equipamentos: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Status */}
            <div className="flex items-center justify-between border rounded-lg p-4">
              <div>
                <Label htmlFor="ativo" className="cursor-pointer">
                  Consultório Ativo
                </Label>
                <p className="text-sm text-gray-600">
                  {form.ativo
                    ? "Este consultório está ativo e disponível"
                    : "Este consultório está inativo"}
                </p>
              </div>
              <Switch
                id="ativo"
                checked={form.ativo}
                onCheckedChange={(checked) =>
                  setForm({ ...form, ativo: checked })
                }
              />
            </div>

            {/* Erro Geral */}
            {erros.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {erros.submit}
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-4 justify-end pt-4 border-t">
              <Link href={`/dashboard/consultórios/${consultorioId}`}>
                <Button variant="outline">Cancelar</Button>
              </Link>
              <Button disabled={salvando}>
                {salvando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
