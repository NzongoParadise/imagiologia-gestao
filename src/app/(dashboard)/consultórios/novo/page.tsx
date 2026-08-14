"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { criarConsultorio } from "@/server/actions/consultorio-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface Especialidade {
  id: number;
  nome: string;
}

export default function NovoConsultorioPage() {
  const router = useRouter();
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [loading, setLoading] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    numero: "",
    nome: "",
    especialidadeId: "",
    andar: "",
    bloco: "",
    capacidade: "1",
    equipamentos: "",
  });

  useEffect(() => {
    async function carregarEspecialidades() {
      try {
        const response = await fetch("/api/especialidades");
        if (response.ok) {
          const dados = await response.json();
          setEspecialidades(dados);
        }
      } catch (error) {
        console.error("Erro ao carregar especialidades:", error);
      }
    }

    carregarEspecialidades();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErros({});
    setLoading(true);

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
        setLoading(false);
        return;
      }

      await criarConsultorio({
        numero: form.numero.trim(),
        nome: form.nome.trim(),
        especialidadeId: form.especialidadeId
          ? parseInt(form.especialidadeId)
          : undefined,
        andar: form.andar || undefined,
        bloco: form.bloco || undefined,
        capacidade: parseInt(form.capacidade),
        equipamentos: form.equipamentos || undefined,
      });

      router.push("/dashboard/consultórios");
    } catch (error) {
      console.error("Erro ao criar consultório:", error);
      setErros({
        submit:
          error instanceof Error
            ? error.message
            : "Erro ao criar consultório",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/consultórios">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Novo Consultório</h1>
          <p className="text-gray-600">Adicionar um novo consultório</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Consultório</CardTitle>
          <CardDescription>
            Preencha os dados do novo consultório
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Número do Consultório *
                </label>
                <Input
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

              <div>
                <label className="block text-sm font-medium mb-2">
                  Nome do Consultório *
                </label>
                <Input
                  placeholder="ex: Consultório de Cardiologia"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className={erros.nome ? "border-red-500" : ""}
                />
                {erros.nome && (
                  <p className="text-red-500 text-sm mt-1">{erros.nome}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Especialidade
                </label>
                <Select
                  options={especialidades.map((esp) => ({
                    value: esp.id.toString(),
                    label: esp.nome,
                  }))}
                  placeholder="Selecionar especialidade"
                  value={form.especialidadeId}
                  onChange={(e) =>
                    setForm({ ...form, especialidadeId: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Capacidade *
                </label>
                <Input
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

              <div>
                <label className="block text-sm font-medium mb-2">
                  Bloco
                </label>
                <Input
                  placeholder="ex: Bloco A"
                  value={form.bloco}
                  onChange={(e) => setForm({ ...form, bloco: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Andar
                </label>
                <Input
                  placeholder="ex: 2º Andar"
                  value={form.andar}
                  onChange={(e) => setForm({ ...form, andar: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Equipamentos
              </label>
              <textarea
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                placeholder="ex: Ecógrafo, Monitor, Estetoscópio"
                value={form.equipamentos}
                onChange={(e) =>
                  setForm({ ...form, equipamentos: e.target.value })
                }
                rows={3}
              />
            </div>

            {erros.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {erros.submit}
              </div>
            )}

            <div className="flex gap-4 justify-end pt-4 border-t">
              <Link href="/dashboard/consultórios">
                <Button variant="outline">Cancelar</Button>
              </Link>
              <Button disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Consultório
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
