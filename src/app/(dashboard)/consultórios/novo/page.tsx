"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { criarConsultorio } from "@/server/actions/consultorio-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    // Carregar especialidades
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
      // Validações
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
      {/* Header */}
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

      {/* Formulário */}
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
                  value={form.especialidadeId}
                  onValueChange={(value) =>
                    setForm({ ...form, especialidadeId: value })
                  }
                >
                  <SelectTrigger id="especialidade">
                    <SelectValue placeholder="Selecionar especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidades.map((esp) => (
                      <SelectItem key={esp.id} value={esp.id.toString()}>
                        {esp.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            {/* Erro Geral */}
            {erros.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {erros.submit}
              </div>
            )}

            {/* Botões */}
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
